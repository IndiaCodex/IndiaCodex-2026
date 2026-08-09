use ouro/types.{Bronze, Gold, Silver, Tier}

const credit_line_cap_tusdm: Int = 25_000_000

pub fn tier_ltv_bps(tier: Tier) -> Int {
  when tier is {
    Bronze -> 5000
    Silver -> 6500
    Gold -> 8000
  }
}

pub fn credit_line(tier: Tier, cumulative_repaid: Int) -> Int {
  when tier is {
    Gold -> {
      let ten_pct = cumulative_repaid / 10
      if ten_pct < credit_line_cap_tusdm {
        ten_pct
      } else {
        credit_line_cap_tusdm
      }
    }
    _ -> 0
  }
}

pub fn max_borrow(
  collateral_usd: Int,
  tier: Tier,
  cumulative_repaid: Int,
) -> Int {
  collateral_usd * tier_ltv_bps(tier) / 10000 + credit_line(
    tier,
    cumulative_repaid,
  )
}

test bronze_is_50pct() {
  max_borrow(400_000_000, Bronze, 0) == 200_000_000
}

test silver_is_65pct() {
  max_borrow(400_000_000, Silver, 600_000_000) == 260_000_000
}

test gold_adds_capped_credit_line() {
  // 80% of 400 = 320; credit line = min(25, 10% of 2_000) = 25 -> 345
  max_borrow(400_000_000, Gold, 2_000_000_000) == 345_000_000
}

test credit_line_capped_at_25() {
  credit_line(Gold, 10_000_000_000) == 25_000_000
}

test non_gold_has_no_credit_line() {
  credit_line(Silver, 5_000_000_000) == 0
}

/// Recomputes a reputation tier from cumulative-repaid (tUSDM, 6-dp) and the
/// number of fully-repaid (closed) loans. Thresholds per design spec section
/// 6: Silver at >=2 loans & >=500 tUSDM repaid; Gold at >=5 loans & >=2,000
/// tUSDM repaid; otherwise Bronze.
pub fn tier_of(cumulative_repaid: Int, loans_repaid: Int) -> Tier {
  if loans_repaid >= 5 && cumulative_repaid >= 2_000_000_000 {
    Gold
  } else if loans_repaid >= 2 && cumulative_repaid >= 500_000_000 {
    Silver
  } else {
    Bronze
  }
}

test tier_of_defaults_to_bronze() {
  tier_of(0, 0) == Bronze
}

test tier_of_reaches_silver_at_threshold() {
  tier_of(500_000_000, 2) == Silver
}

test tier_of_reaches_gold_at_threshold() {
  tier_of(2_000_000_000, 5) == Gold
}

test tier_of_stays_bronze_just_below_silver() {
  tier_of(499_000_000, 2) == Bronze
}
