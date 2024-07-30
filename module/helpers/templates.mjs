export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
      // Actor partials.
      'systems/cause/templates/actor/parts/actor-skill-partial.hbs',
      'systems/cause/templates/actor/parts/actor-core-partial.hbs',
      // Item partials
      
    ]);
  };