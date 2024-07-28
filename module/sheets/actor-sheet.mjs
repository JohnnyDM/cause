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
    data.system = data.actor.system;
    data.system.attributes = data.actor.system.attributes || {};
    data.system.abilities = data.actor.system.abilities || {};

    // Bereite die Skill-Items vor
    data.items = this._prepareSkills(data.items);

    return data;
  }

  /**
   * Bereitet die Skill-Items vor und teilt sie in zwei Spalten auf.
   * @param {Array} items - Die Items des Actors.
   * @returns {Array} - Die vorbereiteten Skill-Items.
   */
  _prepareSkills(items) {
    const skillItems = items.filter(item => item.type === "skill");
    const columns = [[], []];
    skillItems.forEach((item, index) => {
      columns[index % 2].push(item);
    });
    return columns.flat();
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
    html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
    html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
    html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));

    html.find('.add-skill').click(this._onAddSkill.bind(this));
    html.find('.edit-skill').click(this._onEditSkill.bind(this));
    html.find('.delete-skill').click(this._onDeleteSkill.bind(this));
    html.find('.skill-level').change(this._onSkillLevelChange.bind(this));
    html.find('.skill-stat').change(this._onSkillStatChange.bind(this));
    html.find('#save-skill').click(this._onSaveSkill.bind(this));
    // Initialize skill level colors
    html.find('.skill-level').each((index, element) => {
      this._updateSkillLevelColor(element);
    });
  }

  /**
   * Führt einen Stärkewurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
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

  /**
   * Führt einen Agilitätswurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
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

  /**
   * Führt einen Witzwurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
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

  /**
   * Führt einen Intelligenzwurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
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
 
  _onAddSkill(event) {
    event.preventDefault();
    const skills = this.actor.system.skills || [];
    skills.push({ skillname: 'Unnamed Skill', skilllevel: 'untrained', stat: 'strength', description: '', isFirearm: false, forFirearm: 'pistol' });
    this.actor.update({ 'system.skills': skills });
}

_onEditSkill(event) {
    event.preventDefault();
    const index = event.currentTarget.closest('.skill').dataset.index;
    const skill = this.actor.system.skills[index];

    // Show edit dialog and populate fields
    const dialog = document.getElementById('edit-skill-dialog');
    dialog.style.display = 'block';
    document.getElementById('edit-skill-name').value = skill.skillname;
    document.getElementById('edit-skill-description').value = skill.description;
    document.getElementById('edit-skill-level').value = skill.skilllevel;
    document.getElementById('edit-skill-stat').value = skill.stat;
    document.getElementById('edit-skill-is-firearm').checked = skill.isFirearm;
    document.getElementById('edit-skill-for-firearm').value = skill.forFirearm;

    // Save index to the save button for reference
    document.getElementById('save-skill').dataset.index = index;
}

_onDeleteSkill(event) {
    event.preventDefault();
    const index = event.currentTarget.closest('.skill').dataset.index;
    const skills = this.actor.system.skills;
    skills.splice(index, 1);
    this.actor.update({ 'system.skills': skills });
}

_onSaveSkill(event) {
    event.preventDefault();
    const index = event.currentTarget.dataset.index;
    const skills = this.actor.system.skills;
    skills[index] = {
        skillname: document.getElementById('edit-skill-name').value,
        description: document.getElementById('edit-skill-description').value,
        skilllevel: document.getElementById('edit-skill-level').value,
        stat: document.getElementById('edit-skill-stat').value,
        isFirearm: document.getElementById('edit-skill-is-firearm').checked,
        forFirearm: document.getElementById('edit-skill-for-firearm').value,
    };
    this.actor.update({ 'system.skills': skills });

    // Hide edit dialog
    document.getElementById('edit-skill-dialog').style.display = 'none';
}

_onSkillLevelChange(event) {
    const index = event.currentTarget.dataset.index;
    const skills = this.actor.system.skills;
    skills[index].skilllevel = event.currentTarget.value;
    this.actor.update({ 'system.skills': skills });

    // Update dropdown color
    this._updateSkillLevelColor(event.currentTarget);
}

_onSkillStatChange(event) {
    const index = event.currentTarget.dataset.index;
    const skills = this.actor.system.skills;
    skills[index].stat = event.currentTarget.value;
    this.actor.update({ 'system.skills': skills });
}

_updateSkillLevelColor(element) {
    const level = element.value;
    element.classList.remove('untrained', 'trained', 'expert', 'master', 'legendary');
    element.classList.add(level);
}
}