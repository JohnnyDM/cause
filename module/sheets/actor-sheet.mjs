export default class CauseActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cause", "sheet", "actor"],
      template: "systems/cause/templates/actor/actor-character-sheet.hbs",
      width: 650,
      height: 630,
      tabs: [{ navSelector: ".causenavtabs", contentSelector: ".causecontent", initial: "skills" }]
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
    console.log("Formpoints:", data.system.core.formpoints);
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

  async _updateObject(event, formData) {
    return this.object.update(formData);
}

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('input, select').change(event => this._onChangeInput(event));

    html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
    html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
    html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
    html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));

    // Right-click to show bonus dice dialog
    html.find('[data-action="rollStrength"]').contextmenu(this._onShowBonusDialog.bind(this, 'str'));
    html.find('[data-action="rollAgility"]').contextmenu(this._onShowBonusDialog.bind(this, 'agi'));
    html.find('[data-action="rollWits"]').contextmenu(this._onShowBonusDialog.bind(this, 'wit'));
    html.find('[data-action="rollBrains"]').contextmenu(this._onShowBonusDialog.bind(this, 'bra'));

    html.find('[data-action="rollFormpoints"]').click(this._onRollFormpoints.bind(this));

    Hooks.on('renderChatMessage', (app, html, data) => {
      html.find('.push-your-luck-button').click(event => this._onPushYourLuck(event));
  });

    html.find('[data-action="rollSkill"]').click(this._onRollSkill.bind(this));
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
    html.find('.coreskill-box').hover(this._onHoverBox.bind(this));
    html.find('.weaponskill-box').click(event => {
      if (!$(event.currentTarget).hasClass('selected')) {
          this._onClickWeaponSkillBox(event);
      }
    });
    html.find('.weaponskill-box').hover(
      this._onHoverIn.bind(this),
      this._onHoverOut.bind(this)
  );
    html.find('.delete-weaponskill').click(this._onDeleteWeaponSkill.bind(this));
    html.find('.weaponskill-level').change(this._onWeaponSkillLevelChange.bind(this));

    // Add listeners for coreskills
    html.find('.delete-coreskill').click(this._onDeleteCoreSkill.bind(this));
    html.find('.coreskill-level').change(this._onCoreSkillLevelChange.bind(this));
    html.find('.coreskill-box').click(event => {
      if (!$(event.currentTarget).hasClass('selected')) {
          this._onClickCoreSkillBox(event);
      }
    });

    // Add hover effect only if the coreskill is not selected
    html.find('.coreskill-box').hover(
        this._onHoverIn.bind(this),
        this._onHoverOut.bind(this)
    )

    html.find('.coreskill-name').click(this._rollCoreSkill.bind(this));
  }

  _onHoverIn(event) {
    const element = $(event.currentTarget);
    if (!element.hasClass('selected')) {
        element.addClass('highlight');
    }
}

_onHoverOut(event) {
    const element = $(event.currentTarget);
    if (!element.hasClass('selected')) {
        element.removeClass('highlight');
    }
}

_onChangeInput(event) {
  const element = event.currentTarget;
  const value = element.type === "checkbox" ? element.checked : element.value;
  const name = element.name;

  console.log(`Updating actor data: ${name} = ${value}`);
  this.actor.update({ [name]: value });
}

  /**
   * Führt einen Attributswurf aus.
   * @param {Event} event - Das auslösende Ereignis.
   */
  _onRollStrength(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('str', actorData.attributes.str.value);
  }

  _onRollAgility(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('agi', actorData.attributes.agi.value);
  }

  _onRollWits(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('wit', actorData.attributes.wit.value);
  }

  _onRollBrains(event) {
    event.preventDefault();
    const actorData = this.actor.system;
    this._rollAttribute('bra', actorData.attributes.bra.value);
  }
 
  _rollAttribute(attr, baseValue, bonusDice = 0, formPoints = 0) {
    const attributeMap = {
        str: "Strength",
        agi: "Agility",
        wit: "Wits",
        bra: "Brains"
    };

    const fullAttrName = attributeMap[attr] || attr;

    const totalDice = Number(baseValue) + Number(bonusDice) + Number(formPoints);
    const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
    const roll = new Roll(rollFormula);

    roll.roll({async: true}).then(result => {
        console.log("Roll formula:", roll.formula);
        console.log("Roll results:", roll);
        
        // Generating a unique ID for the roll
        const rollId = randomID();

        const critSuccessImg = 'systems/cause/assets/crit_success.png';
        const successImg = 'systems/cause/assets/success.png';
        const failureImg = 'systems/cause/assets/failure.png';

        let critSuccesses = 0;
        let successes = 0;
        let failures = 0;

        if (roll.dice && roll.dice[0] && roll.dice[0].results) {
            roll.dice[0].results.forEach(result => {
                if (result.result === 6) {
                    critSuccesses++;
                } else if (result.result >= 4) {
                    successes++;
                } else if (result.result === 1) {
                    failures++;
                }
            });
        } else {
            console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
        }

        const critSuccessImages = critSuccesses > 0 ? 
            Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
            `<div class="none-text">None</div>`;

        const successImages = successes > 0 ? 
            Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
            `<div class="none-text">None</div>`;

        const failureImages = failures > 0 ? 
            Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
            `<div class="none-text">None</div>`;

        const messageContent = `
            <div class="chat-message">
                <div class="message-content">
                    <div class="attribute-name">${fullAttrName}</div>
                    <div class="footer-line"></div>
                    <div class="results-line">${critSuccessImages}</div>
                    <div class="separator-line"></div>
                    <div class="results-line">${successImages}</div>
                    <div class="separator-line"></div>
                    <div class="results-line">${failureImages}</div>
                    <div class="footer-line"></div>
                    <div class="result-total">Total Result: ${roll.total}</div>
                    <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
                </div>
            </div>
        `;
        console.log("Chat message created with rollId:", rollId);
        // Integration with Dice So Nice
        game.dice3d?.showForRoll(roll, game.user, true).then(() => {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: messageContent,
                roll: roll,
                flags: { rollId: rollId }
            });
        });
    }).catch(error => {
        console.error("Fehler beim Würfeln:", error);
    });
}
_onPushYourLuck(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const rollId = button.dataset.rollId;
  const originalResult = parseInt(button.dataset.originalResult, 10);
  console.log("Push your Luck button clicked. Roll ID:", rollId, "Original Result:", originalResult);

  // Find the original message using the rollId
  const originalMessage = game.messages.find(msg => msg.flags.rollId === rollId);

  if (!originalMessage) {
      console.error("Original message not found");
      return;
  }

  const roll = new Roll('10d6cs>=4df<=3');
  roll.roll({async: true}).then(result => {
      console.log("Push your Luck roll:", roll);

      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result >= 4) {
                  successes++;
              } else {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      // Determine the luck message
      const luckResult = successes - failures;
      let luckMessage;
      if (luckResult === 0) {
          luckMessage = "You are neither lucky nor unlucky";
      } else if (luckResult > 0) {
          luckMessage = "You are rather lucky";
      } else {
          luckMessage = "You are rather unlucky";
      }

      const newTotalResult = originalResult + roll.total;
      console.log(`original: ${originalResult}.. roll: ${roll.total}`, roll);
      const luckRollContent = `
          <div class="attribute-name">Pushing your Luck</div>
          <div class="separator-line"></div>
          <div class="results-line">${successImages}</div>
          <div class="separator-line"></div>
          <div class="results-line">${failureImages}</div>
          <div class="separator-line"></div>
          <div class="luck-message">${luckMessage}</div>
          <div class="result-total">Total Result: ${newTotalResult}</div>
      `;

      // Integration with Dice So Nice
      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          const originalContent = originalMessage.content;

          // Remove the previous total result line
          const updatedContent = originalContent.replace(
              /<div class="result-total">Total Result: .*?<\/div>/,
              ''
          ).replace(
              /<button class="push-your-luck-button"[^>]*>.*?<\/button>/,
              luckRollContent
          );

          originalMessage.update({ content: updatedContent }).then(() => {
              console.log("Original message updated");
          }).catch(error => {
              console.error("Error updating original message:", error);
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
}

  _onShowBonusDialog(attr, event) {
    event.preventDefault();
    const actorData = this.actor.system;
  
    // Zugriff auf die Formpunkte innerhalb des core-Objekts
    const formPointsMax = actorData.core.formpoints.value;
  
    new Dialog({
      title: `Add Bonus Dice and Form Points to ${attr.toUpperCase()}`,
      content: `
        <form>
          <div class="form-group">
            <label>Form Points (max ${formPointsMax}):</label>
            <div class="form-points-input">
              <button type="button" class="decrease-form-points">-</button>
              <input type="number" name="form-points" min="0" value="0" max="${formPointsMax}">
              <button type="button" class="increase-form-points">+</button>
            </div>
          </div>
          <div class="form-group">
            <label>Bonus Dice:</label>
            <div class="bonus-dice-input">
              <button type="button" class="decrease-bonus-dice">-</button>
              <input type="number" name="bonus-dice" min="0" value="0">
              <button type="button" class="increase-bonus-dice">+</button>
            </div>
          </div>
        </form>
      `,
      buttons: {
        roll: {
          label: "Roll",
          callback: (html) => {
            const bonusDice = parseInt(html.find('[name="bonus-dice"]').val(), 10);
            const formPoints = parseInt(html.find('[name="form-points"]').val(), 10);
            this._rollAttribute(attr, actorData.attributes[attr].value, bonusDice, formPoints);
            if (formPoints > 0) {
              const newFormPointsValue = formPointsMax - formPoints;
              this.actor.update({ 'system.core.formpoints.value': newFormPointsValue });
            }
          }
        }
      },
      default: "roll",
      render: (html) => {
        const formPointsInput = html.find('[name="form-points"]');
        const bonusDiceInput = html.find('[name="bonus-dice"]');
  
        html.find('.decrease-form-points').click((event) => {
          let value = parseInt(formPointsInput.val(), 10);
          if (value > 0) formPointsInput.val(--value);
        });
        html.find('.increase-form-points').click((event) => {
          let value = parseInt(formPointsInput.val(), 10);
          if (value < formPointsMax) formPointsInput.val(++value);
        });
        html.find('.decrease-bonus-dice').click((event) => {
          let value = parseInt(bonusDiceInput.val(), 10);
          if (value > 0) bonusDiceInput.val(--value);
        });
        html.find('.increase-bonus-dice').click((event) => {
          let value = parseInt(bonusDiceInput.val(), 10);
          bonusDiceInput.val(++value);
        });
      }
    }).render(true);
  }

  _onRollFormpoints(event) {
    event.preventDefault();

    // Überprüfen, ob die Shift-Taste gedrückt wurde
    if (!event.shiftKey) {
      return; // Funktion nicht ausführen, wenn Shift nicht gedrückt ist
    }

    // Würfeln eines d8
    const roll = new Roll('1d8');
    roll.roll().then(result => {
      const rolledValue = result.total;

      // Formpunkte aktualisieren
      const currentFormpoints = this.actor.system.core.formpoints.value;
      const newFormpoints = currentFormpoints + rolledValue;

      this.actor.update({ 'system.core.formpoints.value': newFormpoints });

      // Ausgabe der Nachricht im Chat
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rolling for Formpoints and adding the result to current formpoints.`,
      });
    });
  }


  _onAddSkill(event) {
    event.preventDefault();
    const skills = this.actor.system.skills || [];
    skills.push({ skillname: 'Unnamed Skill', skilllevel: 'untrained', stat: 'strength', description: '', isFirearm: false, forFirearm: 'pistol' });
    this.actor.update({ 'system.skills': skills });
}

_onRollSkill(event) {
  event.preventDefault();
  const skillIndex = event.currentTarget.closest('.skill').dataset.index;
  const skill = this.actor.system.skills[skillIndex];

  let numDice;
  switch (skill.skilllevel) {
      case 'trained': numDice = 4; break;
      case 'expert': numDice = 6; break;
      case 'master': numDice = 8; break;
      case 'legendary': numDice = 10; break;
      case 'untrained':
      default:
          numDice = 2; break;
  }

  // Hier wird der Attributwert hinzugefügt
  const attributeMap = {
      strength: "str",
      agility: "agi",
      wits: "wit",
      brains: "bra"
  };

  const statKey = attributeMap[skill.stat] || skill.stat;
  const attributeValue = this.actor.system.attributes[statKey]?.value || 0;
  const totalDice = numDice + Number(attributeValue);

  const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
  const roll = new Roll(rollFormula);

  roll.roll({async: true}).then(result => {
      console.log("Roll formula:", roll.formula);
      console.log("Roll results:", roll);
      
      // Generating a unique ID for the roll
      const rollId = randomID();

      const critSuccessImg = 'systems/cause/assets/crit_success.png';
      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      let critSuccesses = 0;
      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result === 6) {
                  critSuccesses++;
              } else if (result.result >= 4) {
                  successes++;
              } else if (result.result === 1) {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const critSuccessImages = critSuccesses > 0 ? 
          Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const totalResult = roll.total || 0;

      const messageContent = `
          <div class="chat-message">
              <div class="message-content">
                  <div class="attribute-name">${skill.skillname}</div>
                  <div class="footer-line"></div>
                  <div class="results-line">${critSuccessImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${successImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${failureImages}</div>
                  <div class="footer-line"></div>
                  <div class="result-total">Total Result: ${totalResult}</div>
                  <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${totalResult}">Push your Luck?</button>
              </div>
          </div>
      `;
      console.log("Chat message created with rollId:", rollId);

      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: messageContent,
              roll: roll,
              flags: { rollId: rollId }
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
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
    //document.getElementById('edit-skill-is-firearm').checked = skill.isFirearm;
    //document.getElementById('edit-skill-for-firearm').value = skill.forFirearm;

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
        //isFirearm: document.getElementById('edit-skill-is-firearm').checked,
        //forFirearm: document.getElementById('edit-skill-for-firearm').value,
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
_onHoverBox(event) {
  $(event.currentTarget).toggleClass('highlight');
}

_onClickWeaponSkillBox(event) {
  const skillSlot = event.currentTarget.dataset.skill;
  console.log("Skill Slot:", skillSlot);
  const weaponskillsData = CONFIG.WEAPONSKILLS;
  const container = document.createElement('div');
  container.className = 'weaponskill-options';

  weaponskillsData.forEach((skill) => {
    const skillDiv = document.createElement('div');
    skillDiv.className = 'weaponskill-option';
    if (skill.image) {
      skillDiv.style.backgroundImage = `url('${skill.image}')`;
    }
    const skillSpan = document.createElement('span');
    skillSpan.textContent = skill.type;
    skillDiv.appendChild(skillSpan);
    skillDiv.dataset.skill = skill.type;
    container.appendChild(skillDiv);
  });

  const content = container.outerHTML;
  console.log("Generated Dialog Content:", content);

  const dialog = new Dialog({
    title: "Choose a Weaponskill",
    content: content,
    buttons: {},
    default: "ok",
    render: (html) => {
      // Set the width of the dialog
      html.closest('.window-content').css('width', '280px');
      
      html.find('.weaponskill-option').click((event) => {
        const selectedSkillType = event.currentTarget.dataset.skill;
        const selectedSkill = weaponskillsData.find(skill => skill.type === selectedSkillType);
        console.log(`Selected ${selectedSkillType} for ${skillSlot}`);
        this._selectWeaponSkill(selectedSkill, skillSlot);
        dialog.close();
      });
    }
  }).render(true);
}

_selectWeaponSkill(skill, skillSlot) {
  console.log(`_selectWeaponSkill called with skill: ${skill.type}, slot: ${skillSlot}`);
  const updateData = {};
  updateData[`system.${skillSlot}`] = { type: skill.type, level: "untrained" };
  this.actor.update(updateData).then(() => {
      console.log(`Updated ${skillSlot} with`, skill);
      this.render();
  });

  // Entfernen der Highlight-Klasse und Hinzufügen der Selected-Klasse
  const box = $(`[data-skill="${skillSlot}"]`);
  box.removeClass('highlight');
  box.addClass('selected');
}

_onDeleteWeaponSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.dataset.skill;
  const updateData = {};
  updateData[`system.${skillSlot}`] = { type: "", level: "" };
  this.actor.update(updateData);
  this.render();
}

_onWeaponSkillLevelChange(event) {
  const skillSlot = event.currentTarget.closest('.weaponskill-box').dataset.skill;
  const newValue = event.currentTarget.value;
  let updateData = {};
  updateData[`system.${skillSlot}.level`] = newValue;
  this.actor.update(updateData);
}

_onDeleteCoreSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.dataset.skill;
  const updateData = {};
  updateData[`system.${skillSlot}`] = { type: "", level: 0 };
  this.actor.update(updateData);
}

_onCoreSkillLevelChange(event) {
  const skillSlot = event.currentTarget.name.replace('coreskill-level', 'coreskills');
  const level = event.currentTarget.value;
  const updateData = {};
  updateData[`system.${skillSlot}.level`] = level;
  this.actor.update(updateData);
}

_onClickCoreSkillBox(event) {
  const skillSlot = event.currentTarget.dataset.skill;
  console.log("Skill Slot:", skillSlot);  // Konsolenausgabe zur Überprüfung

  const coreskillsData = CONFIG.CORESKILLS;
  const container = document.createElement('div');
  container.className = 'coreskill-options';

  coreskillsData.forEach((skill) => {
      const skillDiv = document.createElement('div');
      skillDiv.className = 'coreskill-option';
      if (skill.image) {
          skillDiv.style.backgroundImage = `url('${skill.image}')`;
      }
      const skillSpan = document.createElement('span');
      skillSpan.textContent = skill.type;
      skillDiv.appendChild(skillSpan);
      skillDiv.dataset.skill = skill.type;
      container.appendChild(skillDiv);
  });

  const content = container.outerHTML;
  console.log("Generated Dialog Content:", content);  // Konsolenausgabe zur Überprüfung

  const dialog = new Dialog({
      title: "Choose a Coreskill",
      content: content,
      buttons: {},
      render: (html) => {
          html.find('.coreskill-option').click((event) => {
              const selectedSkillType = event.currentTarget.dataset.skill;
              const selectedSkill = coreskillsData.find(skill => skill.type === selectedSkillType);
              console.log(`Selected ${selectedSkillType} for ${skillSlot}`);  // Konsolenausgabe zur Überprüfung
              this._selectCoreSkill(selectedSkill, skillSlot);
              dialog.close();
          });
      }
  }).render(true);
}

_selectCoreSkill(selectedSkill, skillSlot) {
  const updateData = {};
  updateData[`system.${skillSlot}`] = {
      type: selectedSkill.type,
      level: 'untrained',  // Standardlevel setzen
      stat: selectedSkill.stat // Der Stat aus der Config
  };
  this.actor.update(updateData);
  console.log("Updated actor data with new core skill:", updateData);  // Konsolenausgabe zur Überprüfung
}

_rollCoreSkill(event) {
  event.preventDefault();
  const skillSlot = event.currentTarget.closest('.coreskill-box').dataset.skill;
  const skill = this.actor.system[skillSlot];

  let numDice;
  switch (skill.level) {
      case 'trained': numDice = 4; break;
      case 'expert': numDice = 6; break;
      case 'master': numDice = 8; break;
      case 'legendary': numDice = 10; break;
      case 'untrained':
      default:
          numDice = 2; break;
  }

  const attributeValue = this.actor.system.attributes[skill.stat]?.value || 0;
  const totalDice = numDice + Number(attributeValue);

  const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
  const roll = new Roll(rollFormula);

  roll.roll({async: true}).then(result => {
      console.log("Roll formula:", roll.formula);
      console.log("Roll results:", roll);
      
      // Generating a unique ID for the roll
      const rollId = randomID();

      const critSuccessImg = 'systems/cause/assets/crit_success.png';
      const successImg = 'systems/cause/assets/success.png';
      const failureImg = 'systems/cause/assets/failure.png';

      let critSuccesses = 0;
      let successes = 0;
      let failures = 0;

      if (roll.dice && roll.dice[0] && roll.dice[0].results) {
          roll.dice[0].results.forEach(result => {
              if (result.result === 6) {
                  critSuccesses++;
              } else if (result.result >= 4) {
                  successes++;
              } else if (result.result === 1) {
                  failures++;
              }
          });
      } else {
          console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
      }

      const critSuccessImages = critSuccesses > 0 ? 
          Array(critSuccesses).fill(`<img src="${critSuccessImg}" alt="Critical Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const successImages = successes > 0 ? 
          Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const failureImages = failures > 0 ? 
          Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
          `<div class="none-text">None</div>`;

      const totalResult = roll.total || 0;

      const messageContent = `
          <div class="chat-message">
              <div class="message-content">
                  <div class="attribute-name">${skill.type}</div>
                  <div class="footer-line"></div>
                  <div class="results-line">${critSuccessImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${successImages}</div>
                  <div class="separator-line"></div>
                  <div class="results-line">${failureImages}</div>
                  <div class="footer-line"></div>
                  <div class="result-total">Total Result: ${totalResult}</div>
                  <button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${totalResult}">Push your Luck?</button>
              </div>
          </div>
      `;
      console.log("Chat message created with rollId:", rollId);

      game.dice3d?.showForRoll(roll, game.user, true).then(() => {
          ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: messageContent,
              roll: roll,
              flags: { rollId: rollId }
          });
      });
  }).catch(error => {
      console.error("Fehler beim Würfeln:", error);
  });
}
}