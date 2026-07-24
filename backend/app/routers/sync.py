import logging
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, HTTPException
from temporalio.client import WorkflowExecutionStatus, WorkflowQueryFailedError
from temporalio.common import WorkflowIDConflictPolicy
from temporalio.service import RPCError, RPCStatusCode

from app.core.accounts import linked_lastfm_account
from app.core.auth import CurrentUserDep
from app.core.config import get_settings
from app.core.deps import SessionDep, TemporalClientDep
from app.core.schemas import SyncRunResult, SyncStartResult, SyncStatusResult
from app.sync.sync_workflow import SyncUserWorkflow, pending_steps, user_sync_workflow_id

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/me/sync", response_model=SyncStartResult, status_code=202)
async def start_user_sync(
    user: CurrentUserDep,
    session: SessionDep,
    temporal: TemporalClientDep,
) -> SyncStartResult:
    """Run the full sync pipeline (artists, suggestions, events, playlists)
    as a durable workflow; attaches to the running one if a sync is already
    in flight."""
    account = await linked_lastfm_account(session, user.id)
    if account is None:
        raise HTTPException(status_code=404, detail="No Last.fm account linked")
    if user.city_id is None:
        raise HTTPException(status_code=404, detail="No home city set")

    try:
        handle = await temporal.start_workflow(
            SyncUserWorkflow.run,
            str(user.id),
            id=user_sync_workflow_id(user.id),
            task_queue=get_settings().temporal_task_queue,
            id_conflict_policy=WorkflowIDConflictPolicy.USE_EXISTING,
        )
    except RPCError as exc:
        logger.warning("Failed to start sync workflow", exc_info=exc)
        raise HTTPException(
            status_code=502,
            detail="We couldn't start your sync. Please try again in a moment.",
        ) from None
    return SyncStartResult(workflow_id=handle.id)


_SYNC_STATUS_BY_EXECUTION: dict[
    WorkflowExecutionStatus | None, Literal["running", "completed", "failed"]
] = {
    WorkflowExecutionStatus.RUNNING: "running",
    WorkflowExecutionStatus.CONTINUED_AS_NEW: "running",
    WorkflowExecutionStatus.COMPLETED: "completed",
}


@router.get("/me/sync", response_model=SyncStatusResult)
async def get_user_sync_status(
    user: CurrentUserDep,
    temporal: TemporalClientDep,
) -> SyncStatusResult:
    """Report the user's current (or most recent retained) sync run with
    per-step progress; status "none" if no run exists."""
    handle = temporal.get_workflow_handle(user_sync_workflow_id(user.id), result_type=SyncRunResult)
    try:
        description = await handle.describe(rpc_timeout=timedelta(seconds=5))
    except RPCError as exc:
        if exc.status == RPCStatusCode.NOT_FOUND:
            return SyncStatusResult(status="none", steps=pending_steps())
        logger.warning("Failed to read sync status", exc_info=exc)
        raise HTTPException(
            status_code=502,
            detail="We couldn't load your sync status. Please try again in a moment.",
        ) from None

    status = _SYNC_STATUS_BY_EXECUTION.get(description.status, "failed")
    if status == "completed":
        # A closed run answers queries only by replaying its history on a
        # worker; the run result carries the same steps and is read straight
        # from the server.
        try:
            steps = (await handle.result(rpc_timeout=timedelta(seconds=5))).steps
        except RPCError:
            steps = pending_steps()
    else:
        try:
            steps = await handle.query(SyncUserWorkflow.progress, rpc_timeout=timedelta(seconds=5))
        except RPCError, WorkflowQueryFailedError:
            # Progress is best-effort: the run's history may have aged out or
            # no worker may be available to answer; the overall status still
            # stands.
            steps = pending_steps()
    return SyncStatusResult(
        status=status,
        started_at=description.start_time,
        finished_at=description.close_time,
        steps=steps,
    )
