export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
      // Actor partials.
      'systems/cause/templates/actor/parts/actor-skill-partial.hbs',
      'systems/cause/templates/actor/parts/actor-core-partial.hbs',
      'systems/cause/templates/actor/parts/actor-inventory-partial.hbs',
      'systems/cause/templates/actor/parts/actor-weapon-partial.hbs',
      'systems/cause/templates/actor/parts/actor-info-partial.hbs',
      'systems/cause/templates/actor/parts/actor-favs-partial.hbs',
      // Item partials
      
    ]);
  };