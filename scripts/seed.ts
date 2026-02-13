import {
  assignSuperAdminRole,
  seedAchievements,
  seedDateTemplates,
  seedDLCBundles,
  seedDLCPacks,
  seedForumCategories,
  seedEducationContent,
  seedExpertContent,
  seedLearningContent,
  seedMarketplaceCategories,
  seedPositionsLibrary,
  seedSupportChatQuickResponses,
  seedTrustBadges,
} from "./seed/index";

// ============================================================================
// MAIN EXECUTION
// ============================================================================
(async () => {
  console.log("\n🌱 Starting database seed...\n");

  try {
    await assignSuperAdminRole();
    await seedAchievements();
    await seedForumCategories();
    await seedLearningContent();
    await seedEducationContent();
    await seedExpertContent();
    await seedSupportChatQuickResponses();
    await seedPositionsLibrary();
    await seedDateTemplates();
    await seedMarketplaceCategories();
    await seedDLCPacks();
    await seedDLCBundles();
    await seedTrustBadges();

    console.log("\n✅ Seed complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }
})();
