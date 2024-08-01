export default class CauseItem extends Item {
    /**
     * Extend and override the default options used for this ItemSheet
     */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["cause", "sheet", "item"],
        width: 300,
        height: 400,
        tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
      });
    }
  
    /**
     * Extend the basic Item data model with additional dynamic data.
     */
    prepareData() {
      super.prepareData();
  
      // Get the Item's data
      const itemData = this.system;
      const actorData = this.actor ? this.actor.system : {};
      const data = this.system;
  
      // Prepare item data based on its type
      if (this.type === 'weapon') {
        this._prepareWeaponData(itemData, actorData, data);
      }
    }
  
    /**
     * Prepare weapon specific data
     */
    _prepareWeaponData(itemData, actorData, data) {
      // Example: Add derived data here, e.g., calculate damage based on weapon level
      data.damage = itemData.weaponLevel + actorData.str.value;
    }
  
    /**
     * Extend the sheet data to include data specific to the sheet type
     */
    getData() {
      const context = super.getData();
      context.system = this.system;
      return context;
    }
  }