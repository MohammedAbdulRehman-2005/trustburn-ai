"""Strict lot-level dataset splitting and validation."""
from typing import List, Dict, Set
from backend.app.schemas.burnin import ComponentTrajectory


def verify_lot_isolation(trajectories: List[ComponentTrajectory]) -> Dict[str, Any]:
    """Verifies that no component exists in multiple splits and that lots are strictly partitioned."""
    seen_components: Dict[str, str] = {}
    lot_to_split: Dict[str, Set[str]] = {}

    for t in trajectories:
        cid = t.component_id
        lid = t.lot_id
        split = t.split_group

        if cid in seen_components:
            prev_split = seen_components[cid]
            if prev_split != split:
                raise ValueError(f"LEAKAGE VIOLATION: Component {cid} exists in both {prev_split} and {split}!")
        seen_components[cid] = split

        if lid not in lot_to_split:
            lot_to_split[lid] = set()
        lot_to_split[lid].add(split)

    # Check that each lot belongs to exactly one split
    multi_split_lots = {l: s for l, s in lot_to_split.items() if len(s) > 1}
    if multi_split_lots:
        raise ValueError(f"LOT PARTITION VIOLATION: Lots assigned to multiple splits: {multi_split_lots}")

    return {
        "status": "STRICTLY_ISOLATED",
        "lot_partition": {l: list(s)[0] for l, s in lot_to_split.items()},
        "total_unique_components": len(seen_components)
    }
