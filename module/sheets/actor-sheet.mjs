export default class CauseActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["cause", "sheet", "actor"],
        template: "systems/cause/templates/actor/actor-character-sheet.hbs",
        width: 600,
        height: 600,
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
      });
    }
  
    /** @override */
    getData() {
      const data = super.getData();
  
      // Ensure the system attributes and abilities are correctly referenced
      data.system = data.actor.system;
      data.system.attributes = data.actor.system.attributes || {};
      data.system.abilities = data.actor.system.abilities || {};
  
      return data;
    }
  }