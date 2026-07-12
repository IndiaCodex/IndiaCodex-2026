//// Shared on-chain types for Hydra Minecraft.
////
//// Every block a player places or breaks is written to the Hydra head as one
//// UTxO carrying a `BlockAction` inline datum. This is the exact Plutus data
//// the relay encodes in `server/datum.js`:
////
////   Constr 0 [Integer x, Integer y, Integer z,
////             Integer block_type_id, Integer action, Integer seq]
////
//// Because the base terrain is a pure function of a fixed seed, the head's
//// UTxO set of these records IS the world's save file — replaying them in
//// `seq` order reconstructs the exact world.

/// A single voxel edit, recorded on-chain.
pub type BlockAction {
  /// world X coordinate
  x: Int,
  /// world Y coordinate (height)
  y: Int,
  /// world Z coordinate
  z: Int,
  /// block id: 0 grass · 1 dirt · 2 stone · 3 sand · 4 wood · 5 leaves
  /// 6 glass · 7 brick · 8 water · 9 TNT · 10 coal · 11 iron · 12 gold · 13 diamond
  block_type_id: Int,
  /// 0 = place, 1 = break
  action: Int,
  /// monotonically increasing sequence number for deterministic replay
  seq: Int,
}

pub const action_place: Int = 0

pub const action_break: Int = 1

/// Highest valid block id (0..=13).
pub const max_block_type_id: Int = 13

/// A well-formed record has an in-range block id and a known action.
pub fn is_well_formed(a: BlockAction) -> Bool {
  and {
    a.block_type_id >= 0,
    a.block_type_id <= max_block_type_id,
    or {
      a.action == action_place,
      a.action == action_break,
    },
    a.seq >= 0,
  }
}
