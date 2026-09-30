const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  }
  return new Date(dateStr);
};

// Test local date parsing (no UTC shift)
console.log("=== Testing Date Parsing ===");
const dateStr = "2026-09-30";
const parsed = parseLocalDate(dateStr);
console.log("Input:", dateStr, "Parsed Local Day:", parsed.getDate(), "Month:", parsed.getMonth() + 1);
if (parsed.getDate() !== 30 || parsed.getMonth() + 1 !== 9) {
  console.error("FAIL: UTC date shift detected!");
  process.exit(1);
} else {
  console.log("PASS: Local calendar date preserved without UTC shift.");
}

// Test comparison function with missing values
console.log("\n=== Testing Metric Comparison ===");
function compareMetric(currentVal, prevVal, unit = "", isHigherBetter = true) {
  if (currentVal === null || currentVal === undefined || currentVal === "") {
    return {
      currentDisplay: "Not recorded",
      prevDisplay: prevVal !== null && prevVal !== undefined && prevVal !== "" ? `${prevVal}${unit}` : "No data",
      diffDisplay: null,
      pctDisplay: null,
      trend: "none",
      hasData: false,
      hasComparison: false
    };
  }

  const currentNum = Number(currentVal);
  const currentDisplay = `${currentNum.toLocaleString()}${unit ? ` ${unit}` : ""}`;

  if (prevVal === null || prevVal === undefined || prevVal === "") {
    return {
      currentDisplay,
      prevDisplay: "No data",
      diffDisplay: "Previous-day comparison unavailable",
      pctDisplay: null,
      trend: "none",
      hasData: true,
      hasComparison: false
    };
  }

  const prevNum = Number(prevVal);
  const prevDisplay = `${prevNum.toLocaleString()}${unit ? ` ${unit}` : ""}`;
  const diff = currentNum - prevNum;
  const pct = prevNum > 0 ? (diff / prevNum) * 100 : null;

  let trend = "stable";
  if (Math.abs(diff) < 0.01) {
    trend = "stable";
  } else if (diff > 0) {
    trend = isHigherBetter ? "improving" : "declining";
  } else {
    trend = isHigherBetter ? "declining" : "improving";
  }

  const diffSign = diff > 0 ? "+" : "";
  const formattedDiff = typeof diff === "number" && !Number.isInteger(diff) ? diff.toFixed(1) : diff;
  const diffDisplay = `${diffSign}${formattedDiff}${unit ? ` ${unit}` : ""}`;
  const pctDisplay = pct !== null ? `${diffSign}${pct.toFixed(1)}%` : null;

  return {
    currentDisplay,
    prevDisplay,
    diff,
    diffDisplay,
    pctDisplay,
    trend,
    hasData: true,
    hasComparison: true
  };
}

// Scenario 1: Steps today 1200, yesterday 875
const r1 = compareMetric(1200, 875, "steps", true);
console.log("Steps r1:", r1);
if (r1.currentDisplay !== "1,200 steps" || r1.diffDisplay !== "+325 steps" || r1.pctDisplay !== "+37.1%" || r1.trend !== "improving") {
  console.error("FAIL: Steps comparison incorrect", r1);
  process.exit(1);
}
console.log("PASS: Steps today vs yesterday matches requirement exactly.");

// Scenario 2: Missing yesterday sleep
const r2 = compareMetric(6.5, null, "hrs", true);
console.log("Sleep r2 (missing yesterday):", r2);
if (r2.diffDisplay !== "Previous-day comparison unavailable" || r2.prevDisplay !== "No data") {
  console.error("FAIL: Missing yesterday should not be 0", r2);
  process.exit(1);
}
console.log("PASS: Missing previous day never converts to 0.");

// Scenario 3: Missing calorie intake
const r3 = compareMetric(null, 1800, "kcal", false);
console.log("Calories r3 (missing today):", r3);
if (r3.currentDisplay !== "Not recorded") {
  console.error("FAIL: Missing calories should say 'Not recorded'", r3);
  process.exit(1);
}
console.log("PASS: Missing calorie intake distinguished from 0 kcal.");

console.log("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
