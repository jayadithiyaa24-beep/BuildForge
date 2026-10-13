function errorHandler(err, req, res, next) {
  console.error('API Error:', err.message || err);

  // Check for Neo4j Driver Connection Error
  if (err.code === 'ServiceUnavailable' || err.name === 'Neo4jError' && err.message.includes('Could not perform discovery')) {
    return res.status(503).json({
      success: false,
      error: 'Neo4j Database Unavailable',
      message: 'Could not establish connection to the Neo4j instance configured in backend/.env.',
      details: err.message,
      suggestion: 'Ensure your Neo4j database (local Bolt at port 7687 or Neo4j Aura) is active and credentials are correct.'
    });
  }

  // Check for Neo4j Uniqueness Constraint Violation
  if (err.code && err.code.includes('ConstraintValidationFailed')) {
    return res.status(409).json({
      success: false,
      error: 'Unique Constraint Violation',
      message: 'A record with the given unique identifier already exists in the Neo4j database.',
      details: err.message
    });
  }

  // Check for Cypher Syntax or Client Errors
  if (err.name === 'Neo4jError' && err.code && err.code.includes('SyntaxError')) {
    return res.status(400).json({
      success: false,
      error: 'Cypher Query Syntax Error',
      message: err.message
    });
  }

  // Generic fallback
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred while processing the graph operation.'
  });
}

module.exports = errorHandler;
