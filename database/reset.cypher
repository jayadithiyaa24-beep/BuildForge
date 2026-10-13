// ==============================================================================
// BUILDFORGE DA3 - DATABASE RESET SCRIPT
// WARNING: Clears all nodes and relationships for development reseeding
// ==============================================================================

MATCH (n) DETACH DELETE n;
