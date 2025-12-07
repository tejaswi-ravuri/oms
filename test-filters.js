// Test script to verify filter functionality
// This can be run in the browser console or as a Node.js script

const testFilters = async () => {
  const baseUrl = "http://localhost:3000/api/admin/ledgers";

  // Test 1: Basic fetch without filters
  console.log("Testing basic fetch...");
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();
    console.log("✅ Basic fetch successful:", data);
  } catch (error) {
    console.error("❌ Basic fetch failed:", error);
  }

  // Test 2: Search filter
  console.log("\nTesting search filter...");
  try {
    const response = await fetch(`${baseUrl}?search=test`);
    const data = await response.json();
    console.log("✅ Search filter successful:", data);
  } catch (error) {
    console.error("❌ Search filter failed:", error);
  }

  // Test 3: City filter
  console.log("\nTesting city filter...");
  try {
    const response = await fetch(`${baseUrl}?city=Mumbai`);
    const data = await response.json();
    console.log("✅ City filter successful:", data);
  } catch (error) {
    console.error("❌ City filter failed:", error);
  }

  // Test 4: State filter
  console.log("\nTesting state filter...");
  try {
    const response = await fetch(`${baseUrl}?state=Maharashtra`);
    const data = await response.json();
    console.log("✅ State filter successful:", data);
  } catch (error) {
    console.error("❌ State filter failed:", error);
  }

  // Test 5: GST filter
  console.log("\nTesting GST filter...");
  try {
    const response = await fetch(`${baseUrl}?has_gst=true`);
    const data = await response.json();
    console.log("✅ GST filter successful:", data);
  } catch (error) {
    console.error("❌ GST filter failed:", error);
  }

  // Test 6: Combined filters
  console.log("\nTesting combined filters...");
  try {
    const response = await fetch(
      `${baseUrl}?search=test&city=Mumbai&has_gst=true`
    );
    const data = await response.json();
    console.log("✅ Combined filters successful:", data);
  } catch (error) {
    console.error("❌ Combined filters failed:", error);
  }

  // Test 7: Sorting
  console.log("\nTesting sorting...");
  try {
    const response = await fetch(`${baseUrl}?sort=business_name&order=asc`);
    const data = await response.json();
    console.log("✅ Sorting successful:", data);
  } catch (error) {
    console.error("❌ Sorting failed:", error);
  }
};

// Export for use in browser or Node
if (typeof module !== "undefined" && module.exports) {
  module.exports = testFilters;
} else {
  // Browser usage
  window.testFilters = testFilters;
  console.log(
    "Filter test function loaded. Run testFilters() in console to test."
  );
}
