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
      data.items = this._prepareSkills(data.items);
      return data;
    }

    _prepareSkills(items) {
      const skillItems = items.filter(item => item.type === "skill");
      const columns = [[], []]; // Ändere auf 2 Spalten
      skillItems.forEach((item, index) => {
        columns[index % 2].push(item); // Ändere auf 2 Spalten
      });
      const flatSkills = columns.flat();
      console.log("Flat skills:", flatSkills); // Debug-Ausgabe
      return flatSkills;
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
      html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
      html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
      html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));
      html.on('click', '.delete-skill', this._onDeleteSkill.bind(this));
      html.on('change', '.skill-level', this._onSkillLevelChange.bind(this));
      html.find('.skill-level').each((_, select) => {
        this._initializeSkillLevel(select);
        this._updateSkillLevelColor(select);
      });
      html.on('click', '.edit-skill', this._onEditSkill.bind(this));
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
    async _onDeleteSkill(event) {
      event.preventDefault();
      const button = event.currentTarget;
      const skillIndex = button.dataset.skillIndex;
      console.log("Button clicked. Data-skill-index:", skillIndex);  // Debugging-Ausgabe
      if (skillIndex === undefined) {
        ui.notifications.error("Skill index is missing.");
        return;
      }
  
      const skills = this.actor.items.filter(item => item.type === "skill");
      const skill = skills[skillIndex];
      if (!skill) {
        ui.notifications.error("Skill not found.");
        return;
      }
  
      await skill.delete();
      console.log(`Skill ${skill.id} deleted successfully.`);
    }
    async _onSkillLevelChange(event) {
      const select = event.currentTarget;
      const skillIndex = select.dataset.skillIndex;
      console.log("Skill index:", skillIndex);  // Debugging-Ausgabe
      if (skillIndex === undefined) {
        ui.notifications.error("Skill index is missing.");
        return;
      }
  
      const skills = this.actor.items.filter(item => item.type === "skill");
      const skill = skills[skillIndex];
      if (!skill) {
        ui.notifications.error("Skill not found.");
        console.log("Skill not found for Skill index:", skillIndex);  // Debugging-Ausgabe
        return;
      }
  
      const newLevel = parseInt(select.value);
      await skill.update({ 'system.skillLevel': newLevel });
  
      this._updateSkillLevelColor(select); // Aktualisiere die Farbe nach der Änderung
    }
    _updateSkillLevelColor(select) {
      const level = parseInt(select.value);
      const classes = ['untrained', 'trained', 'expert', 'master', 'legendary'];
      select.classList.remove(...classes);
      if (level >= 1 && level <= 5) {
        select.classList.add(classes[level - 1]);
      }
    }
    _initializeSkillLevel(select) {
      const skillIndex = select.dataset.skillIndex;
      const skills = this.actor.items.filter(item => item.type === "skill");
      const skill = skills[skillIndex];
      if (skill) {
        select.value = skill.system.skillLevel;
        this._updateSkillLevelColor(select); // Setze die Farbe basierend auf dem initialen Wert
      }
    }
    async _onEditSkill(event) {
      event.preventDefault();
      const button = event.currentTarget;
      const skillIndex = button.dataset.skillIndex;
      console.log("Edit button clicked. Data-skill-index:", skillIndex);  // Debugging-Ausgabe
      if (skillIndex === undefined) {
        ui.notifications.error("Skill index is missing.");
        return;
      }
  
      const skills = this.actor.items.filter(item => item.type === "skill");
      const skill = skills[skillIndex];
      if (!skill) {
        ui.notifications.error("Skill not found.");
        return;
      }
  
      skill.sheet.render(true);
    }
  }