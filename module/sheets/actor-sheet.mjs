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
      console.log("Items:", data.items);
      data.items = this._prepareItems(data.items);
      return data;
    }

    _prepareItems(items) {
      const skillItems = items.filter(item => item.type === "skill");
      const columns = [[], [], []];
      skillItems.forEach((item, index) => {
        columns[index % 3].push(item);
      });
      return columns.flat();
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
      html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
      html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
      html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));
      html.find('.delete-item').click(this._onDeleteItem.bind(this));
    }
  
    _onRollStrength(event) {
      event.preventDefault();
      const actorData = this.actor.system;
      const strength = actorData.attributes.str.value;
      const rollFormula = `${strength}d6cs>=4df=1x=6cs>=4`;
      const roll = new Roll(rollFormula);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rolling for ${strength} Strength`
      });
    }
    _onRollAgility(event) {
      event.preventDefault();
      const actorData = this.actor.system;
      const agility = actorData.attributes.agi.value;
      const rollFormula = `${agility}d6cs>=4df=1x=6cs>=4`;
      const roll = new Roll(rollFormula);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rolling for ${agility} Agility`
      });
    }
    _onRollWits(event) {
      event.preventDefault();
      const actorData = this.actor.system;
      const wits = actorData.attributes.wit.value;
      const rollFormula = `${wits}d6cs>=4df=1x=6cs>=4`;
      const roll = new Roll(rollFormula);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rolling for ${wits} Wits`
      });
    }
    _onRollBrains(event) {
      event.preventDefault();
      const actorData = this.actor.system;
      const brains = actorData.attributes.bra.value;
      const rollFormula = `${brains}d6cs>=4df=1x=6cs>=4`;
      const roll = new Roll(rollFormula);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rolling for ${brains} Brains`
      });
    }
    async _onDeleteItem(event) {
      event.preventDefault();
      const button = event.currentTarget;
      const itemIndex = button.dataset.itemIndex;
      console.log("Button clicked. Data-item-index:", itemIndex);  // Debugging-Ausgabe
      if (itemIndex === undefined) {
        ui.notifications.error("Item index is missing.");
        return;
      }
  
      const items = this.actor.items.filter(item => item.type === "skill");
      const item = items[itemIndex];
      if (!item) {
        ui.notifications.error("Item not found.");
        return;
      }
  
      await item.delete();
      console.log(`Item ${item.id} deleted successfully.`);
    }
  }