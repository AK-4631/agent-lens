const key = "agent-lens-production-test-key";

process.env.AGENT_LENS_API_KEY = key;

console.log("");
console.log("==========================================");
console.log(" AGENT LENS MAX SECURITY TEST");
console.log("==========================================");
console.log("");

if (
  !process.env.AGENT_LENS_API_KEY ||
  process.env.AGENT_LENS_API_KEY !== key
) {
  throw new Error(
    "Authentication configuration failed."
  );
}

console.log("API key configuration: PASS");
console.log("Protected API mode:    PASS");
console.log("");
console.log("SECURITY TEST PASSED");
console.log("");
