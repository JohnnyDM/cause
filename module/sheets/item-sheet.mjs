export default class CauseItemSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          classes: ['cause', 'sheet', 'item'],
          width: 520,
          height: 480,
          tabs: [
            {
              navSelector: '.sheet-tabs',
              contentSelector: '.sheet-body',
              initial: 'description',
            },
          ],
        });
      }
    
    get template() {
        return `systems/cause/templates/item/item-${this.item.type}.hbs`;
    }

    getData() {
      // Retrieve base data structure.
      const context = super.getData();
    
      // Use a safe clone of the item data for further operations.
      const itemData = context.data;
    
      // Retrieve the roll data for TinyMCE editors.
      context.rollData = this.item.getRollData();
    
      // Add the item's data to context.data for easier access, as well as flags.
      context.system = itemData.system;
      context.flags = itemData.flags;

      // Add the skill data to context
      context.skill = itemData.system.skill;

      return context;
    }
}