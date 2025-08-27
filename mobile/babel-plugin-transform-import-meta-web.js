/**
 * Babel plugin to transform import.meta for web compatibility
 * Converts import.meta to process.env for web platform
 */
module.exports = function() {
  return {
    name: 'transform-import-meta-web',
    visitor: {
      MemberExpression(path) {
        const { node } = path;
        
        // Check if this is import.meta
        if (
          node.object.type === 'MetaProperty' &&
          node.object.meta.name === 'import' &&
          node.object.property.name === 'meta'
        ) {
          // Replace import.meta.env with process.env
          if (node.property.name === 'env') {
            path.replaceWithSourceString('process.env');
          } else if (node.property.name === 'url') {
            // Replace import.meta.url with a placeholder
            path.replaceWithSourceString('"file://" + __filename');
          } else {
            // Replace generic import.meta with an empty object
            path.replaceWithSourceString('{}');
          }
        }
      },
      MetaProperty(path) {
        // Handle standalone import.meta
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          path.replaceWithSourceString('({ env: process.env, url: "file://" + __filename })');
        }
      }
    }
  };
};