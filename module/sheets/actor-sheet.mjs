export default class CauseActorSheet extends ActorSheet {

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["cause", "sheet", "actor"],
        template: "systems/cause/templates/actor/actor-character-sheet.hbs",
        width: 650,
        height: 650,
        tabs: [{ navSelector: ".causenavtabs", contentSelector: ".causecontent", initial: "favs" }, { navSelector: ".sidenavtabs", contentSelector: ".inventorycontent", initial: "weapons" }]
      });
    }
  
    getData() {
      const data = super.getData();
      data.system = data.actor.system;
      data.system.attributes = data.actor.system.attributes || {};
      data.system.abilities = data.actor.system.abilities || {};

      // Prepare Coreskills for Favourites
      const coreSkills = Object.keys(data.system)
      .filter(key => key.startsWith('coreskill') && data.system[key].type)
      .map(key => data.system[key]);
  
      data.coreSkills = coreSkills;

      // Preparing Items
      const weapon = [];
      const armor = [];
      const tool = [];
      const backpack = [];
      for (let i of data.items) {
        i.img = i.img || DEFAULT_TOKEN;
        if (i.type === 'weapon') {
          weapon.push(i);
        }
        if (i.type === 'armor') {
          armor.push(i);
        }
        if (i.type === 'tool') {
          tool.push(i);
        }
        if (i.type === 'backpack') {
          backpack.push(i);
        }
      }
    
      data.weapon = weapon;
      data.armor = armor;
      data.tool = tool;
      data.backpack = backpack;
      

      return data;
    }
  
    activateListeners(html) {
      super.activateListeners(html);

      //Edit Mental
      html.find('[data-action="editMental"]').click(this._onIncreaseMental.bind(this));
      html.find('[data-action="editMental"]').contextmenu(this._onDecreaseMental.bind(this));

      //Attribute-Rolls Left-Click
      html.find('[data-action="rollStrength"]').click(this._onRollStrength.bind(this));
      html.find('[data-action="rollAgility"]').click(this._onRollAgility.bind(this));
      html.find('[data-action="rollWits"]').click(this._onRollWits.bind(this));
      html.find('[data-action="rollBrains"]').click(this._onRollBrains.bind(this));   
      
      //Attribute-Rolls Right-Click
      html.find('[data-action="rollStrength"]').contextmenu(this._onShowBonusDialog.bind(this, 'str'));
      html.find('[data-action="rollAgility"]').contextmenu(this._onShowBonusDialog.bind(this, 'agi'));
      html.find('[data-action="rollWits"]').contextmenu(this._onShowBonusDialog.bind(this, 'wit'));
      html.find('[data-action="rollBrains"]').contextmenu(this._onShowBonusDialog.bind(this, 'bra'));

      //Push your Luck in Chat Messages
      Hooks.on('renderChatMessage', (app, html, data) => {
        const button = event.currentTarget;
        button.disabled = true;
        if (button) {
          html.find('.push-your-luck-button').click(event => this._onPushYourLuck(event));
        }
      });
      html.find('[data-action="rollLuck"]').click(this._onPushYourLuckSingle.bind(this));

      //Edit Formpoints
      html.find('[data-action="rollForm"]').contextmenu(this._onEditFormpoints.bind(this));
      html.find('[data-action="rollForm"]').click(this._onRollFormpoints.bind(this));

      // Favs Tab Listeners
      html.find('.favs-name-weapon').click(this._onWeaponRoll.bind(this));
      html.find('.favs-name-weapon').contextmenu(event => {
        const element = event.currentTarget.closest('.favs-item');
        const slotType = element.dataset.slotType;
        const weapon = this.actor.system[slotType];
        const itemId = weapon.itemID;
        this._onShowWeaponBonusDialog(itemId, event);
      });

      html.find('.favs-name-core').click(this._rollCoreSkillFavs.bind(this));
      html.find('.favs-name-core').contextmenu(event => {
        event.preventDefault();
        const skillName = event.currentTarget.textContent.trim();
        const coreSkills = Object.keys(this.actor.system)
        .filter(key => key.startsWith('coreskill') && this.actor.system[key].type)
        .map(key => this.actor.system[key]);
        const skill = Object.values(coreSkills).find(s => s.type === skillName);
        this._onShowSkillBonusDialog(skill, skill.stat, event);
      });

      html.find('.skill-name, .favs-name-skill').contextmenu(event => {
        event.preventDefault();
        const skillSlot = $(event.currentTarget).closest('.skillroll').data('index');
        const skill = this.actor.system.skills[skillSlot];
        this._onShowSkillBonusDialog(skill, skill.stat, event);
      });

      //Coreskill-Tab
      html.find('.coreskill-box').click(event => {
        if (!$(event.currentTarget).hasClass('selected')) {
            this._onClickCoreSkillBox(event);
        }
      });
      html.find('.coreskill-name').click(event => {
        if (event.shiftKey) {
          this._onDeleteCoreSkill(event);
        } else {
          this._rollCoreSkill(event);
        }
      });
      html.find('.coreskill-level').change(this._onCoreSkillLevelChange.bind(this));

      html.find('.weaponskill-box').click(event => {
        if (!$(event.currentTarget).hasClass('selected')) {
            this._onClickWeaponSkillBox(event);
        }
      });
      html.find('.weaponskill-name').click(event => {
        if (event.shiftKey) {
          this._onDeleteWeaponSkill(event);
        }
      });
      html.find('.weaponskill-level').change(this._onWeaponSkillLevelChange.bind(this));

      // Skills Management
      html.find('.add-skill').click(this._onAddSkill.bind(this));
      html.find('.add-skill').contextmenu(event => {
        event.preventDefault();
        this._onRightClickAddSkill(event);
      });

      html.find('.edit-skill').click(this._onEditSkill.bind(this));
      html.find('.skill-level').change(this._onSkillLevelChange.bind(this));
      html.find('#save-skill').click(this._onSaveSkill.bind(this));

      html.find('[data-action="rollSkill"]').click(event => {
        if (event.shiftKey) {
          this._onDeleteSkill(event);
        } else {
          this._onRollSkill(event);
        }
      });

      html.find('.toggle-skill').change(this._toggleSkill.bind(this));

      // Inventory Management
      html.find('.item-row').each((index, element) => {
        element.draggable = true;
        element.addEventListener('dragstart', this._onDragStartGear.bind(this));
      });
      html.find('.weapondropbox, .armordropbox').each((index, element) => {
        element.addEventListener('dragover', this._onDragOverGear.bind(this));
        element.addEventListener('drop', this._onDropGear.bind(this));
      });
      html.find('.item-delete').click(this._onDeleteItem.bind(this));
      html.find('.item-edit').click(this._onEditItem.bind(this));
      html.find('.remove-fav').click(this._onRemoveFav.bind(this));

      // Tools and Backpacks
      // Drag-and-Drop für Backpacks
      html.find('.backpack-item').each((index, element) => {
        element.draggable = true;
        element.addEventListener('dragstart', this._onDragStartBackpack.bind(this));
      });

      // Drag-and-Drop für Tools
      html.find('.tool-item').each((index, element) => {
          element.draggable = true;
          element.addEventListener('dragstart', this._onDragStartTool.bind(this));
      });

      // Drop-Zone für Backpacks in die dynamische Tabelle
      html.find('.dynamic-backpack-container').each((index, element) => {
          element.addEventListener('dragover', this._onDragOverDynamic.bind(this));
          element.addEventListener('drop', this._onDropBackpack.bind(this));
      });
    }
  
    //Edit Mental-Health
    _onIncreaseMental(event) {
      event.preventDefault();
      const actor = this.actor.system;
      if (actor.core.mental < 10) {
        this.actor.update({ 'system.core.mental': (actor.core.mental + 1) });
      }
    }

    _onDecreaseMental(event) {
      event.preventDefault();
      const actor = this.actor.system;
      if (actor.core.mental > 0) {
        this.actor.update({ 'system.core.mental': (actor.core.mental - 1) });
      }
    }

    //Attribute-Rolls
    _onRollStrength(event) {
      event.preventDefault();
      const actor = this.actor.system;
      this._rollDice('str', actor.attributes.str);
    }

    _onRollAgility(event) {
      event.preventDefault();
      const actor = this.actor.system;
      this._rollDice('agi', actor.attributes.agi)
    }

    _onRollWits(event) {
      event.preventDefault();
      const actor = this.actor.system;
      this._rollDice('wit', actor.attributes.wit)
    }

    _onRollBrains(event) {
      event.preventDefault();
      const actor = this.actor.system;
      this._rollDice('bra', actor.attributes.bra)
    }

    _onShowBonusDialog(attr, event) {
      event.preventDefault();
      const actor = this.actor.system;
    
      const formPointsMax = actor.core.formpoints;
    
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
              const bonusDice = parseInt(html.find('[name="bonus-dice"]').val(), 10) || 0;
              const formPoints = parseInt(html.find('[name="form-points"]').val(), 10) || 0;
              this._rollDice(attr, actor.attributes[attr], bonusDice, formPoints);
              if (formPoints > 0) {
                const newFormPointsValue = formPointsMax - formPoints;
                this.actor.update({ 'system.core.formpoints': newFormPointsValue });
              }
            }
          }
        },
        default: "roll",
        render: (html) => {
          const formPointsInput = html.find('[name="form-points"]');
          const bonusDiceInput = html.find('[name="bonus-dice"]');
    
          html.find('.decrease-form-points').click((event) => {
            let value = parseInt(formPointsInput.val(), 10) || 0;
            if (value > 0) formPointsInput.val(--value);
          });
          html.find('.increase-form-points').click((event) => {
            let value = parseInt(formPointsInput.val(), 10) || 0;
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

    _rollDice(attr, baseValue, bonusDice = 0, formPoints = 0) {
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

    roll.roll().then(result => {
        
        const rollId = foundry.utils.randomID();

        const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
        const successImg = 'systems/cause/assets/dice/success.png';
        const failureImg = 'systems/cause/assets/dice/failure.png';

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
                </div>
            </div>
        `;
        //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    //Push luck methode for Chat-Message
    _onPushYourLuck(event) {
      event.preventDefault();
      const button = event.currentTarget;
      button.disabled = true;

      const rollId = button.dataset.rollId;
      const originalResult = parseInt(button.dataset.originalResult, 10);
    
      const originalMessage = game.messages.find(msg => msg.flags.rollId === rollId);
    
      if (!originalMessage) {
          console.error("Original message not found");
          button.disabled = false; 
          return;
      }
    
      // Perform the roll
      const roll = new Roll('10d6cs>=4df<=3');
      roll.evaluate().then(result => {
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
    
          const successImg = 'systems/cause/assets/dice/success.png';
          const failureImg = 'systems/cause/assets/dice/failure.png';
    
          const successImages = successes > 0 ? 
              Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
              `<div class="none-text">None</div>`;
    
          const failureImages = failures > 0 ? 
              Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
              `<div class="none-text">None</div>`;
    
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

          game.dice3d?.showForRoll(roll, game.user, true).then(() => {
              const originalContent = originalMessage.content;
    
              const updatedContent = originalContent.replace(
                  /<div class="result-total">Total Result: .*?<\/div>/,
                  ''
              ).replace(
                  /<button class="push-your-luck-button"[^>]*>.*?<\/button>/,
                  luckRollContent
              );
    
              originalMessage.update({ content: updatedContent }).then(() => {
                  button.disabled = false;  
              }).catch(error => {
                  console.error("Error updating original message:", error);
                  button.disabled = false;  
              });
          });
      }).catch(error => {
          console.error("Fehler beim Würfeln:", error);
          button.disabled = false;  
      });
    }

    _onPushYourLuckSingle(event) {
      const rollFormula = `10d6cs>=4df<=3`;
      const roll = new Roll(rollFormula);
    
      roll.roll().then(result => {
          console.log("Roll formula:", roll.formula);
          console.log("Roll results:", roll);
          
          const rollId = foundry.utils.randomID();
    
          const successImg = 'systems/cause/assets/dice/success.png';
          const failureImg = 'systems/cause/assets/dice/failure.png';
    
          let successes = 0;
          let failures = 0;
    
          if (roll.dice && roll.dice[0] && roll.dice[0].results) {
              roll.dice[0].results.forEach(result => {
                  if (result.result >= 4) {
                      successes++;
                  } else if (result.result <= 3) {
                      failures++;
                  }
              });
          } else {
              console.error("Die Würfelrolle enthält keine Ergebnisse.", roll);
          }
    
          const successImages = successes > 0 ? 
              Array(successes).fill(`<img src="${successImg}" alt="Success" class="result-img">`).join('') : 
              `<div class="none-text">None</div>`;
    
          const failureImages = failures > 0 ? 
              Array(failures).fill(`<img src="${failureImg}" alt="Failure" class="result-img">`).join('') : 
              `<div class="none-text">None</div>`;
    
          const luckResult = successes - failures;
          let luckMessage;
          if (luckResult === 0) {
              luckMessage = "You are neither lucky nor unlucky";
          } else if (luckResult > 0) {
              luckMessage = "You are rather lucky";
          } else {
              luckMessage = "You are rather unlucky";
          }
    
          const messageContent = `
              <div class="chat-message">
                  <div class="message-content">
                      <div class="attribute-name">Pushing your Luck!</div>
                      <div class="footer-line"></div>
                      <div class="results-line">${successImages}</div>
                      <div class="separator-line"></div>
                      <div class="results-line">${failureImages}</div>
                      <div class="separator-line"></div>
                      <div class="luck-message">${luckMessage}</div>
                      <div class="footer-line"></div>
                      <div class="result-total">Total Result: ${roll.total}</div>
                  </div>
              </div>
          `;
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

    //Edit Formpoints Methodes
    _onEditFormpoints(event) {
      const actor = this.actor.system;
      
      if (event.shiftKey) {  
        if (actor.core.formpoints < 8) {
          this.actor.update({ 'system.core.formpoints': (actor.core.formpoints + 1) });
        }
      }
      if (event.altKey) {  
        if (actor.core.formpoints > 0) {
          this.actor.update({ 'system.core.formpoints': (actor.core.formpoints - 1) });
        }
      }
    }

    _onRollFormpoints(event) {
      event.preventDefault();
      if (event.shiftKey) {
        const roll = new Roll('1d8');
        roll.roll().then(result => {
          const rolledValue = result.total;
          const newFormpoints = rolledValue;
    
          this.actor.update({ 'system.core.formpoints': newFormpoints });
    
          roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: `Rolling for Formpoints.`,
          });
        });
      }
    }

    // Fav-Tab Methodes
    _onWeaponRoll(event) {
      event.preventDefault();
      const element = event.currentTarget.closest('.favs-item');
      const slotType = element.dataset.slotType;
      
      const weapon = this.actor.system[slotType];
    
      if (!weapon) {
        console.error(`Weapon not found for slot type: ${slotType}`);
        return;
      }
    
      const itemId = weapon.itemID;
    
      if (!itemId) {
        console.error(`Item ID not found for weapon in slot type: ${slotType}`);
        return;
      }
    
      console.log(`Item ID for weapon in slot type ${slotType}: ${itemId}`);
    
      const item = this.actor.items.get(itemId);
    
      if (!item) {
        console.error(`Item not found for item ID: ${itemId}`);
        return;
      }
    
      console.log(`Item found: ${item.name}`);
    
      const weaponType = item.system.weaponType;
      const weaponLevel = parseInt(item.system.weaponLevel) || 0;
    
      console.log(`Weapon Type: ${weaponType}, Weapon Level: ${weaponLevel}`);
    
      const weaponSkills = [this.actor.system.weaponskills1, this.actor.system.weaponskills2, this.actor.system.weaponskills3];
      const matchingSkill = weaponSkills.find(skill => skill.type.toLowerCase() === weaponType.toLowerCase());
    
      let skillLevel;
      const characterLevel = this.actor.system.core.level || 0;
      let bonusDice = 0;
      if (!matchingSkill) {
        skillLevel = 0;
      } else {
        switch (matchingSkill.level) {
          case 'trained': skillLevel = 4; break;
          case 'expert': skillLevel = 6; break;
          case 'master': skillLevel = 8; break;
          case 'legendary': skillLevel = 10; break;
          case 'untrained':
          default:
            skillLevel = 2; break;
        }
        if (characterLevel >= 1 && characterLevel <= 3) {
          bonusDice = 1;
        } else if (characterLevel >= 4 && characterLevel <= 6) {
          bonusDice = 2;
        } else if (characterLevel >= 7 && characterLevel <= 9) {
          bonusDice = 3;
        } else if (characterLevel >= 10 && characterLevel <= 12) {
          bonusDice = 4;
        } else if (characterLevel >= 13 && characterLevel <= 15) {
          bonusDice = 5;
        }
      }  
    
      const strength = this.actor.system.attributes.str || 0;
      const agility = this.actor.system.attributes.agi || 0;
      const comboStat = Math.floor((Number(strength) + Number(agility)) / 2);
    
      const totalDice = skillLevel + weaponLevel + bonusDice + comboStat;
    
      const rollFormula = `${totalDice}d6cs>=4df=1x=6cs>=4df=1`;
      const roll = new Roll(rollFormula);
    
      roll.roll().then(result => {
        console.log("Roll formula:", roll.formula);
        console.log("Roll results:", roll);
    
        const rollId = foundry.utils.randomID();
    
        const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
        const successImg = 'systems/cause/assets/dice/success.png';
        const failureImg = 'systems/cause/assets/dice/failure.png';
    
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
              <div class="attribute-name">${item.name} (${weaponType})</div>
              <div class="footer-line"></div>
              <div class="results-line">${critSuccessImages}</div>
              <div class="separator-line"></div>
              <div class="results-line">${successImages}</div>
              <div class="separator-line"></div>
              <div class="results-line">${failureImages}</div>
              <div class="footer-line"></div>
              <div class="result-total">Total Result: ${roll.total}</div>
            </div>
          </div>
        `;
        //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    _onShowWeaponBonusDialog(itemId, event) {
      event.preventDefault();
      const item = this.actor.items.get(itemId);
      const weaponType = item.system.weaponType;
      const weaponName = item.name;
      const actorData = this.actor.system;
    
      const formPointsMax = actorData.core.formpoints;
    
      new Dialog({
        title: `Add Bonus Dice and Form Points to ${weaponName}`,
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
              const bonusDice = parseInt(html.find('[name="bonus-dice"]').val(), 10) || 0;
              const formPoints = parseInt(html.find('[name="form-points"]').val(), 10) || 0;
              this._rollWeaponWithBonus(itemId, bonusDice, formPoints);
              if (formPoints > 0) {
                const newFormPointsValue = formPointsMax - formPoints;
                this.actor.update({ 'system.core.formpoints': newFormPointsValue });
              }
            }
          }
        },
        default: "roll",
        render: (html) => {
          const formPointsInput = html.find('[name="form-points"]');
          const bonusDiceInput = html.find('[name="bonus-dice"]');
    
          html.find('.decrease-form-points').click((event) => {
            let value = parseInt(formPointsInput.val(), 10) || 0;
            if (value > 0) formPointsInput.val(--value);
          });
          html.find('.increase-form-points').click((event) => {
            let value = parseInt(formPointsInput.val(), 10) || 0;
            if (value < formPointsMax) formPointsInput.val(++value);
          });
          html.find('.decrease-bonus-dice').click((event) => {
            let value = parseInt(bonusDiceInput.val(), 10) || 0;
            if (value > 0) bonusDiceInput.val(--value);
          });
          html.find('.increase-bonus-dice').click((event) => {
            let value = parseInt(bonusDiceInput.val(), 10) || 0;
            bonusDiceInput.val(++value);
          });
        }
      }).render(true);
    }

    _rollWeaponWithBonus(itemId, bonusDice, formPoints) {
      const item = this.actor.items.get(itemId);
      const weaponType = item.system.weaponType;
      const weaponLevel = parseInt(item.system.weaponLevel) || 0;
    
      const weaponSkills = [this.actor.system.weaponskills1, this.actor.system.weaponskills2];
      const matchingSkill = weaponSkills.find(skill => skill.type.toLowerCase() === weaponType.toLowerCase());
    
      let skillLevel;
      const characterLevel = this.actor.system.core.level || 0;
      let levelBonusDice = 0;
      if (!matchingSkill) {
        skillLevel = 0;
      } else {
        switch (matchingSkill.level) {
          case 'trained': skillLevel = 4; break;
          case 'expert': skillLevel = 6; break;
          case 'master': skillLevel = 8; break;
          case 'legendary': skillLevel = 10; break;
          case 'untrained':
          default:
            skillLevel = 2; break;
        }
        if (characterLevel >= 1 && characterLevel <= 3) {
          levelBonusDice = 1;
        } else if (characterLevel >= 4 && characterLevel <= 6) {
          levelBonusDice = 2;
        } else if (characterLevel >= 7 && characterLevel <= 9) {
          levelBonusDice = 3;
        } else if (characterLevel >= 10 && characterLevel <= 12) {
          levelBonusDice = 4;
        } else if (characterLevel >= 13 && characterLevel <= 15) {
          levelBonusDice = 5;
        }
      }
    
      const strength = this.actor.system.attributes.str || 0;
      const agility = this.actor.system.attributes.agi || 0;
      const statBonusDice = Math.floor((Number(strength) + Number(agility)) / 2);
    
      const totalDice = Number(skillLevel) + Number(levelBonusDice) + Number(statBonusDice) + Number(weaponLevel) + Number(bonusDice) + Number(formPoints);
    
      const rollFormula = `${totalDice}d6cs>=4df=1x=6cs>=4df=1`;
      const roll = new Roll(rollFormula);
    
      roll.evaluate().then(result => {
        console.log("Roll formula:", roll.formula);
        console.log("Roll results:", roll);
    
        const rollId = foundry.utils.randomID();
    
        const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
        const successImg = 'systems/cause/assets/dice/success.png';
        const failureImg = 'systems/cause/assets/dice/failure.png';
    
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
              <div class="attribute-name">${item.name} (${weaponType})</div>
              <div class="footer-line"></div>
              <div class="results-line">${critSuccessImages}</div>
              <div class="separator-line"></div>
              <div class="results-line">${successImages}</div>
              <div class="separator-line"></div>
              <div class="results-line">${failureImages}</div>
              <div class="footer-line"></div>
              <div class="result-total">Total Result: ${roll.total}</div>
            </div>
          </div>
        `;
        //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    _onShowSkillBonusDialog(skill, stat, event) {
      event.preventDefault();
  
      if (!skill || (!skill.type && !skill.skillname)) {
          console.error("Skill or skill.type/skill.skillname is undefined:", skill);
          return;
      }
  
      const actorData = this.actor.system;
      const skillName = skill.type || skill.skillname;
      const skillStat = stat || skill.stat;
      const skillLevel = skill.level || skill.skilllevel;

      const formPointsMax = actorData.core.formpoints;
  
      new Dialog({
        title: `Add Bonus Dice ${skillName}`,
        content: `
          <form>
            <div class="form-group">
              <label>Attribute:</label>
              <div class="attribute-buttons">
                <button type="button" class="attribute-button" data-attribute="str" ${skillStat === "str" ? 'class="active"' : ''}>Strength</button>
                <button type="button" class="attribute-button" data-attribute="agi" ${skillStat === "agi" ? 'class="active"' : ''}>Agility</button>
                <button type="button" class="attribute-button" data-attribute="wit" ${skillStat === "wit" ? 'class="active"' : ''}>Wits</button>
                <button type="button" class="attribute-button" data-attribute="bra" ${skillStat === "bra" ? 'class="active"' : ''}>Brains</button>
              </div>
            </div>
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
              const selectedAttribute = html.find('.attribute-button.active').data('attribute') || skillStat;
              this._rollSkillWithBonus(skill, selectedAttribute, bonusDice, formPoints);
            }
          }
        },
        default: "roll",
        render: (html) => {
          html.find('.attribute-button').click((event) => {
            html.find('.attribute-button').removeClass('active');
            $(event.currentTarget).addClass('active');
          });
  
          html.find('.decrease-form-points').click((event) => {
            const input = html.find('[name="form-points"]');
            let value = parseInt(input.val(), 10);
            if (value > 0) input.val(--value);
          });
          html.find('.increase-form-points').click((event) => {
            const input = html.find('[name="form-points"]');
            let value = parseInt(input.val(), 10);
            if (value < actorData.core.formpoints) input.val(++value);
          });
          html.find('.decrease-bonus-dice').click((event) => {
            const input = html.find('[name="bonus-dice"]');
            let value = parseInt(input.val(), 10);
            if (value > 0) input.val(--value);
          });
          html.find('.increase-bonus-dice').click((event) => {
            const input = html.find('[name="bonus-dice"]');
            let value = parseInt(input.val(), 10);
            input.val(++value);
          });
        }
      }).render(true);
    }

    _rollSkillWithBonus(skill, stat, bonusDice, formPoints) {
      const skillLevelMap = {
          'untrained': 2,
          'trained': 4,
          'expert': 6,
          'master': 8,
          'legendary': 10
      };
      const skillStat = {
        'wit': 'wit',
        'str': 'str',
        'agi': 'agi',
        'bra': 'bra',
        'strength': 'str',
        'agility': 'agi',
        'wits': 'wit',
        'brains': 'bra'
    };
      const numDice = skillLevelMap[skill.level] || skillLevelMap[skill.skilllevel];
      const attributeValue = this.actor.system.attributes[skillStat[stat]] || 0;
      const totalDice = numDice + Number(attributeValue) + Number(bonusDice) + Number(formPoints);
    
      const rollFormula = `${totalDice}d6cs>=4df=1x=6cs>=4df=1`;
      const roll = new Roll(rollFormula);
    
      roll.roll().then(result => {
          console.log("Roll formula:", roll.formula);
          console.log("Roll results:", roll);
    
          const rollId = foundry.utils.randomID();
    
          const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
          const successImg = 'systems/cause/assets/dice/success.png';
          const failureImg = 'systems/cause/assets/dice/failure.png';
    
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
                      <div class="attribute-name">${skill.type || skill.skillname} (${stat})</div>
                      <div class="footer-line"></div>
                      <div class="results-line">${critSuccessImages}</div>
                      <div class="separator-line"></div>
                      <div class="results-line">${successImages}</div>
                      <div class="separator-line"></div>
                      <div class="results-line">${failureImages}</div>
                      <div class="footer-line"></div>
                      <div class="result-total">Total Result: ${roll.total}</div>
                  </div>
              </div>
          `;
          //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    _rollCoreSkillFavs(event) {
      event.preventDefault();
      const skillName = event.currentTarget.textContent.trim();
    
      // Sicherstellen, dass coreskills existieren
      const coreskills = this.actor.system.coreskills || {};
    
      const coreSkills = Object.keys(this.actor.system)
      .filter(key => key.startsWith('coreskill') && this.actor.system[key].type)
      .map(key => this.actor.system[key]);
    
      // Überprüfen, ob es Coreskills gibt, um den Fehler zu vermeiden
      if (Object.keys(coreSkills).length === 0) {
        console.error("No coreskills available.");
        return;
      }
    
      // Finde den Skill, dessen 'type' mit dem im Event angeklickten Namen übereinstimmt
      const skill = Object.values(coreSkills).find(s => s.type === skillName);
    
      if (!skill) {
        console.error(`Skill not found: ${skillName}`);
        return;
      }
    
      console.log("Found skill:", skill);
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
    
      const attributeValue = this.actor.system.attributes[skill.stat] || 0;
      const totalDice = numDice + Number(attributeValue);
    
      const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
      const roll = new Roll(rollFormula);
    
      roll.roll().then(result => {
          console.log("Roll formula:", roll.formula);
          console.log("Roll results:", roll);
    
          const rollId = foundry.utils.randomID();
    
          const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
          const successImg = 'systems/cause/assets/dice/success.png';
          const failureImg = 'systems/cause/assets/dice/failure.png';
    
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
                  </div>
              </div>
          `;
          //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    //Coreskill-Tab Methodes

    _onClickCoreSkillBox(event) {
      const skillSlot = event.currentTarget.dataset.skill; 
    
      const coreskillsData = CONFIG.CORESKILLS;
      console.log(coreskillsData);
      const mappedSkills = {
        str: coreskillsData.filter(skill => skill.stat === 'str'),
        agi: coreskillsData.filter(skill => skill.stat === 'agi'),
        wit: coreskillsData.filter(skill => skill.stat === 'wit'),
        bra: coreskillsData.filter(skill => skill.stat === 'bra')
      };
    
      const container = document.createElement('div');
      container.className = 'coreskill-options';
    
      const columns = {
        str: document.createElement('div'),
        agi: document.createElement('div'),
        wit: document.createElement('div'),
        bra: document.createElement('div')
      };
    
      columns.str.innerHTML = '<h3>Strength</h3>';
      columns.agi.innerHTML = '<h3>Agility</h3>';
      columns.wit.innerHTML = '<h3>Wits</h3>';
      columns.bra.innerHTML = '<h3>Brains</h3>';
    
      for (let [key, value] of Object.entries(mappedSkills)) {
        value.forEach((skill) => {
          const skillDiv = document.createElement('div');
          skillDiv.className = 'coreskill-option';
          if (skill.image) {
            skillDiv.style.backgroundImage = `url('${skill.image}')`;
          }
          const skillSpan = document.createElement('span');
          skillSpan.textContent = skill.type;
          skillDiv.appendChild(skillSpan);
          skillDiv.dataset.skill = skill.type;
          skillDiv.dataset.img = skill.image || ''; 
          columns[key].appendChild(skillDiv);
        });
      }
    
      const columnWrapper = document.createElement('div');
      columnWrapper.className = 'column-wrapper';
      for (let column of Object.values(columns)) {
        columnWrapper.appendChild(column);
      }
      container.appendChild(columnWrapper);
    
      const content = container.outerHTML; 
    
      const dialog = new Dialog({
        title: "Choose a Coreskill",
        content: content,
        buttons: {},
        default: "ok",
        render: (html) => {
          html.find('.coreskill-option').click((event) => {
            const selectedSkillType = event.currentTarget.dataset.skill;
            const selectedSkill = coreskillsData.find(skill => skill.type === selectedSkillType);
            const selectedSkillImg = event.currentTarget.dataset.img || 'systems/cause/assets/coreskills/blank-black.png'; 
            this._selectCoreSkill(selectedSkill, skillSlot, selectedSkillImg);
            dialog.close();
          });
        }
      }, { classes: ["wider-dialog"], width: 1125 }).render(true); 
    }

    _selectCoreSkill(selectedSkill, skillSlot, imgPath) {
      const updateData = {};
      updateData[`system.${skillSlot}`] = {
        type: selectedSkill.type,
        level: 'untrained', 
        stat: selectedSkill.stat, 
        img: imgPath 
      };
      this.actor.update(updateData).then(() => {
          
      }).catch(error => {
        console.error("Error updating actor data:", error);
      });
    }

    _onDeleteCoreSkill(event) {
      event.preventDefault();
      const skillSlot = event.currentTarget.dataset.skill;
      if (!skillSlot) {
        console.error("Skill slot is not defined in the event target.");
        return;
      }
      const updateData = {};
      updateData[`system.${skillSlot}`] = { 
        type: "", 
        level: 0,
        img: 'systems/cause/assets/coreskills/blank-black.png' 
      };
      this.actor.update(updateData).then(() => {
        
      }).catch(error => {
        console.error("Error deleting core skill:", error);
      });
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
    
      const attributeValue = this.actor.system.attributes[skill.stat] || 0;
      const totalDice = numDice + Number(attributeValue);
    
      const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
      const roll = new Roll(rollFormula);
    
      roll.roll().then(result => {
          console.log("Roll formula:", roll.formula);
          console.log("Roll results:", roll);
    
          const rollId = foundry.utils.randomID();
    
          const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
          const successImg = 'systems/cause/assets/dice/success.png';
          const failureImg = 'systems/cause/assets/dice/failure.png';
    
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
                  </div>
              </div>
          `;
          //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    _onCoreSkillLevelChange(event) {
      const skillSlot = event.currentTarget.name.replace('coreskill-level', 'coreskill');
      const level = event.currentTarget.value;
      const updateData = {};
      updateData[`system.${skillSlot}.level`] = level;
      this.actor.update(updateData);
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
        const skillImage = skill.image || 'systems/cause/assets/systems/cause/assets/weaponskills/blank-black.png'; 
        skillDiv.style.backgroundImage = `url('${skillImage}')`;
        const skillSpan = document.createElement('span');
        skillSpan.textContent = skill.type;
        skillDiv.appendChild(skillSpan);
        skillDiv.dataset.skill = skill.type;
        skillDiv.dataset.image = skillImage; 
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
          html.find('.weaponskill-option').click((event) => {
            const selectedSkillType = event.currentTarget.dataset.skill;
            const selectedSkill = weaponskillsData.find(skill => skill.type === selectedSkillType);
            console.log(`Selected ${selectedSkillType} for ${skillSlot}`);
            this._selectWeaponSkill(selectedSkill, skillSlot);
            dialog.close();
          });
        }
      }, { classes: ["weaponskill-dialog"], width: 550 }).render(true); 
    }

    _selectWeaponSkill(skill, skillSlot) {
      console.log(`_selectWeaponSkill called with skill: ${skill.type}, slot: ${skillSlot}`);
      const skillImage = skill.image || 'systems/cause/assets/weaponskills/blank-black.png';
      const updateData = {};
      updateData[`system.${skillSlot}`] = {
        type: skill.type,
        level: "untrained",
        img: skillImage 
      };
      this.actor.update(updateData).then(() => {
        console.log(`Updated ${skillSlot} with`, skill);
        this.render();
      });
    
      const box = $(`[data-skill="${skillSlot}"]`);
      box.removeClass('highlight');
      box.addClass('selected');
    }

    _onDeleteWeaponSkill(event) {
      event.preventDefault();
      const skillSlot = event.currentTarget.dataset.skill;
      const updateData = {};
      updateData[`system.${skillSlot}`] = { type: "", level: 0, img: 'systems/cause/assets/weaponskills/blank-black.png' }; 
      this.actor.update(updateData);
    }

    _onWeaponSkillLevelChange(event) {
      const skillSlot = event.currentTarget.closest('.weaponskill-box').dataset.skill;
      const newValue = event.currentTarget.value;
      let updateData = {};
      updateData[`system.${skillSlot}.level`] = newValue;
      this.actor.update(updateData);
    }

    // Skills Management
    _onAddSkill(event) {
      event.preventDefault();
      const skillsObj = this.actor.system.skills || {};
      const skills = Object.values(skillsObj);
  
      skills.push({ skillname: 'New Skill', skilllevel: 'untrained', stat: 'strength', description: '', isFirearm: false, forFirearm: 'pistol', favs: false });
  
      const newSkillsObj = {};
      skills.forEach((skill, index) => {
          newSkillsObj[index] = skill;
      });
  
      this.actor.update({ 'system.skills': newSkillsObj });
    }

    _onRightClickAddSkill(event) {
      const skillsData = CONFIG.SKILLS;
  
      const statMapping = {
          str: "strength",
          agi: "agility",
          wit: "wits",
          bra: "brains"
      };
  
      const container = document.createElement('div');
      container.className = 'skills-options';
      const columns = [];
      let column = document.createElement('div');
      column.className = 'skills-column';
      let skillsInColumn = 0;
  
      skillsData.forEach((skill, index) => {
          if (skillsInColumn === 10) {
              columns.push(column);
              column = document.createElement('div');
              column.className = 'skills-column';
              skillsInColumn = 0;
          }
  
          const skillDiv = document.createElement('div');
          skillDiv.className = 'skill-option';
          if (skill.image) {
              skillDiv.style.backgroundImage = `url('${skill.image}')`;
          }
          const skillSpan = document.createElement('span');
          const skillStat = statMapping[skill.stat] || 'strength'; 
          skillSpan.innerHTML = `${skill.type} (${skillStat})`;
          skillDiv.appendChild(skillSpan);
          skillDiv.dataset.skill = skill.type;
          skillDiv.dataset.image = skill.image || 'path/to/default_image.png'; 
          skillDiv.dataset.stat = skillStat;
          column.appendChild(skillDiv);
  
          skillsInColumn++;
      });
  
      columns.push(column); 
      columns.forEach(col => container.appendChild(col)); 
  
      const content = container.outerHTML;
  
      const dialog = new Dialog({
          title: "Choose a Skill",
          content: content,
          buttons: {},
          default: "ok",
          render: (html) => {
              const dialogContent = html.closest('.window-content');
              dialogContent.css('width', 'auto');
              dialogContent.css('max-width', 'none'); 
              dialogContent.css('height', 'auto'); 
  
              html.find('.skill-option').click((event) => {
                  const selectedSkill = {
                      type: event.currentTarget.dataset.skill,
                      image: event.currentTarget.dataset.image,
                      skillname: event.currentTarget.dataset.skill,
                      description: '',
                      skilllevel: 'untrained',
                      stat: event.currentTarget.dataset.stat,
                      favs: false
                  };
                  console.log("Selected skill:", selectedSkill);
  
                  const skillsObj = this.actor.system.skills || {};
                  const skills = Object.values(skillsObj);
  
                  let nextFreeIndex = skills.findIndex(skill => !skill.skillname);
                  if (nextFreeIndex === -1) {
                      nextFreeIndex = skills.length;
                  }
  
                  skills[nextFreeIndex] = {
                      type: selectedSkill.type,
                      image: selectedSkill.image,
                      skillname: selectedSkill.skillname,
                      description: selectedSkill.description,
                      skilllevel: selectedSkill.skilllevel,
                      stat: selectedSkill.stat,
                      favs: false
                  };
  
                  const newSkillsObj = {};
                  skills.forEach((skill, index) => {
                      newSkillsObj[index] = skill;
                  });
  
                  this.actor.update({ 'system.skills': newSkillsObj }).then(() => {
                      console.log("Updated actor data with new skill:", newSkillsObj);
                      dialog.close();
                  });
              });
          }
      }, { classes: ["skill-wider-dialog"], width: 1200 }).render(true); 
    }    

    _onEditSkill(event) {
      event.preventDefault();
      const index = event.currentTarget.closest('.skill').dataset.index;
      const skill = this.actor.system.skills[index];
    
      new Dialog({
          title: "Edit Skill",
          content: `
              <form>
                  <div class="form-group">
                      <label>Skill Name</label>
                      <input type="text" id="edit-skill-name" value="${skill.skillname}">
                  </div>
                  <div class="form-group">
                      <label>Description</label>
                      <textarea id="edit-skill-description">${skill.description}</textarea>
                  </div>
                  <div class="form-group">
                      <label>Skill Level</label>
                      <select id="edit-skill-level" class="whitedropdown">
                          <option value="untrained" ${skill.skilllevel === "untrained" ? "selected" : ""}>Untrained</option>
                          <option value="trained" ${skill.skilllevel === "trained" ? "selected" : ""}>Trained</option>
                          <option value="expert" ${skill.skilllevel === "expert" ? "selected" : ""}>Expert</option>
                          <option value="master" ${skill.skilllevel === "master" ? "selected" : ""}>Master</option>
                          <option value="legendary" ${skill.skilllevel === "legendary" ? "selected" : ""}>Legendary</option>
                      </select>
                  </div>
                  <div class="form-group">
                      <label>Stat</label>
                      <select id="edit-skill-stat" class="whitedropdown">
                          <option value="strength" ${skill.stat === "strength" ? "selected" : ""}>Strength</option>
                          <option value="agility" ${skill.stat === "agility" ? "selected" : ""}>Agility</option>
                          <option value="wits" ${skill.stat === "wits" ? "selected" : ""}>Wits</option>
                          <option value="brains" ${skill.stat === "brains" ? "selected" : ""}>Brains</option>
                      </select>
                  </div>
              </form>
          `,
          buttons: {
              save: {
                  icon: '<i class="fas fa-check"></i>',
                  label: "Save",
                  callback: html => this._onSaveSkill(html, index)
              }
          },
          default: "save"
      }).render(true);
    }

    _onSaveSkill(html, index) {
      const skills = this.actor.system.skills;
    
      skills[index].skillname = html.find('#edit-skill-name').val();
      skills[index].description = html.find('#edit-skill-description').val();
      skills[index].skilllevel = html.find('#edit-skill-level').val();
      skills[index].stat = html.find('#edit-skill-stat').val();
    
      this.actor.update({ 'system.skills': skills });
    }

    _onSkillLevelChange(event) {
      const index = event.currentTarget.dataset.index;
      const skills = this.actor.system.skills;
      skills[index].skilllevel = event.currentTarget.value;
      this.actor.update({ 'system.skills': skills });
    }

    _onDeleteSkill(event) {
      event.preventDefault();
      const index = event.currentTarget.closest('.skill').dataset.index;
    
      const skillsObj = this.actor.system.skills || [];
      const skills = Array.isArray(skillsObj) ? skillsObj : Object.values(skillsObj);
    
      skills.splice(index, 1);
    
      this.actor.update({ 'system.skills': skills }).then(() => {
        this.render();  
      });
    }

    _onRollSkill(event) {
      event.preventDefault();
      const skillIndex = event.currentTarget.closest('.skillroll').dataset.index;
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
    
      const attributeMap = {
          strength: "str",
          agility: "agi",
          wits: "wit",
          brains: "bra"
      };
    
      const statKey = attributeMap[skill.stat] || skill.stat;
      const attributeValue = this.actor.system.attributes[statKey] || 0;
      const totalDice = numDice + Number(attributeValue);
    
      const rollFormula = `${totalDice}d6cs>=4df1x6cs>=4df1`;
      const roll = new Roll(rollFormula);
    
      roll.roll().then(result => {
          console.log("Roll formula:", roll.formula);
          console.log("Roll results:", roll);
          
          const rollId = foundry.utils.randomID();
    
          const critSuccessImg = 'systems/cause/assets/dice/crit_success.png';
          const successImg = 'systems/cause/assets/dice/success.png';
          const failureImg = 'systems/cause/assets/dice/failure.png';
    
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
                  </div>
              </div>
          `;
          //<button class="push-your-luck-button" data-roll-id="${rollId}" data-original-result="${roll.total}">Push your Luck?</button>
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

    _toggleSkill(event) {
      const skillId = event.currentTarget.dataset.skillId;
      const isChecked = event.currentTarget.checked;
  
      const skillKey = `system.skills.${skillId}.favs`;
      this.actor.update({ [skillKey]: isChecked });
    }

    // Inventory Management
    _onDragStartGear(event) {
      const itemId = event.currentTarget.dataset.itemId;
      event.dataTransfer.setData('text/plain', itemId);
      event.dataTransfer.effectAllowed = 'move';
    }
  
    _onDragOverGear(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }

    _onDropGear(event) {
      event.preventDefault();
      const itemId = event.dataTransfer.getData('text/plain');
      const dropTargetId = event.currentTarget.dataset.dropTarget;
      this._handleItemDropGear(itemId, dropTargetId);
    }

    _handleItemDropGear(itemId, dropTargetId) {
      const actor = this.actor;
      const item = actor.items.get(itemId);
      if (!item) {
        console.error(`Item with ID ${itemId} not found.`);
        return;
      }
  
      switch (dropTargetId) {
        case 'invweaponbox1':
          const validWeaponTypes1 = [
            "Pistol",
            "Assault Rifle",
            "Submachine Gun",
            "Shotgun",
            "Machine Gun",
            "Hunting Rifle",
            "Sniper Rifle",
            "Heavy Weapon"
          ];
          if (validWeaponTypes1.includes(item.system.weaponType)) {
            actor.update({'system.mainweapon.name': item.name});
            actor.update({'system.mainweapon.img': item.img});
            actor.update({'system.mainweapon.itemID': itemId});
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal - item.system.concealment});
            actor.update({'system.mainweapon.conceal': item.system.concealment});
          } else {
            ui.notifications.warn(`You can't use weapons with Type "${item.system.weaponType}" in the Main-Weapon-Slot!`);
          }
          break;
        case 'invweaponbox2':
          const validWeaponTypes2 = [
            "Pistol",
            "Submachine Gun",
            "Shotgun"
          ];
          if (validWeaponTypes2.includes(item.system.weaponType)) {
            actor.update({'system.sideweapon.name': item.name});
            actor.update({'system.sideweapon.img': item.img});
            actor.update({'system.sideweapon.itemID': itemId});
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal - item.system.concealment});
            actor.update({'system.sideweapon.conceal': item.system.concealment});
          } else {
            ui.notifications.warn(`You can't use weapons with Type "${item.system.weaponType}" in the Side-Weapon-Slot!`);
          }
          break;
        case 'invweaponbox3':
          const validWeaponTypes3 = [
            "Melee Weapon"
          ];
          if (validWeaponTypes3.includes(item.system.weaponType)) {
            actor.update({'system.meleeweapon.name': item.name});
            actor.update({'system.meleeweapon.img': item.img});
            actor.update({'system.meleeweapon.itemID': itemId});
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal - item.system.concealment});
            actor.update({'system.meleeweapon.conceal': item.system.concealment});
          } else {
            ui.notifications.warn(`You can't use weapons with Type "${item.system.weaponType}" in the Melee-Weapon-Slot!`);
          }
          break;
        case 'invarmorbox':
          if (!item.system.weaponType) {
            actor.update({'system.armorslot.name': item.name});
            actor.update({'system.armorslot.img': item.img});
            actor.update({'system.itemstat.armor': item.system.armorlevel});
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal - item.system.concealment});
            actor.update({'system.armorslot.conceal': item.system.concealment});
          } else {
            ui.notifications.warn(`You can't use weapons inside the Armor-Slot!`);
          }
          break;
      }
    }
    
    _onDeleteItem(event) {
      event.preventDefault();
      const li = $(event.currentTarget).closest('.item-row');
      const itemName = li.find('.item-name').text().trim();
    
      const item = this.actor.items.find(i => i.name === itemName);
    
      if (item) {
        Dialog.confirm({
          title: `Delete Item: ${item.name}`,
          content: `<p>Are you sure you want to delete ${item.name}?</p>`,
          yes: () => {
            this.actor.deleteEmbeddedDocuments("Item", [item.id]);
          },
          no: () => {},
          defaultYes: false
        });
      }
    }

    _onEditItem(event) {
      event.preventDefault();
      const li = $(event.currentTarget).closest('.item-row');
      const itemName = li.find('.item-name').text().trim();
      const item = this.actor.items.find(i => i.name === itemName);
      if (item) {
         item.sheet.render(true);
      }
    }
    
    _onRemoveFav(event) {
      event.preventDefault();
      const actor = this.actor;
      const slot = event.currentTarget.dataset.slot;
      const updateData = {};
      
      switch(slot) {
          case 'mainweapon':
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal + actor.system.mainweapon.conceal});
            updateData[`system.mainweapon`] = { name: "Main-Weapon", img: "systems/cause/assets/weaponskills/blank-black.png" };
            break;
          case 'sideweapon':
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal + actor.system.sideweapon.conceal});
            updateData[`system.sideweapon`] = { name: "Side-Weapon", img: "systems/cause/assets/weaponskills/blank-black.png" };
            break;
          case 'meleeweapon':
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal + actor.system.meleeweapon.conceal});
            updateData[`system.meleeweapon`] = { name: "Melee-Weapon", img: "systems/cause/assets/weaponskills/blank-black.png" };
            break;
          case 'armorslot':
            actor.update({'system.itemstat.conceal': actor.system.itemstat.conceal + actor.system.armorslot.conceal});
            updateData['system.armorslot'] = { name: "Armor-Slot", img: "systems/cause/assets/weaponskills/blank-black.png" };
            actor.update({'system.itemstat.armor': 0});
            break;
          default:
            console.error("Unknown slot:", slot);
            return;
      }
    
      this.actor.update(updateData).then(() => {
          
      }).catch(error => {
          console.error("Error clearing slot:", error);
      });
    }

    // Tools and Backpacks
    // Methode für Drag-Start von Backpacks
    _onDragStartBackpack(event) {
      const itemId = event.currentTarget.dataset.itemId;
      event.dataTransfer.setData('text/plain', itemId);
    }

    // Methode für Drag-Start von Tools
    _onDragStartTool(event) {
      const itemId = event.currentTarget.dataset.itemId;
      event.dataTransfer.setData('text/plain', itemId);
    }

    // Methode für Drag-Over über die dynamische Tabelle
    _onDragOverDynamic(event) {
      event.preventDefault();
      console.log("Yes");
    }

    // Methode für Drop von Backpacks in die dynamische Tabelle
    _onDropBackpack(event) {
      event.preventDefault();
      const backpackId = event.dataTransfer.getData('text/plain');
      const backpackItem = this.actor.items.get(backpackId);

      if (backpackItem) {
          this._handleBackpackDropInDynamicArea(backpackItem);
      }
    }

    // Logik für das Ablegen eines Backpacks in die dynamische Tabelle
    _handleBackpackDropInDynamicArea(backpack) {
      const dynamicBackpackContent = document.getElementById('dynamic-backpack-content');
      const existingRow = dynamicBackpackContent.querySelector(`tr[data-item-id='${backpack.id}']`);

      if (!existingRow) {
          const row = `<tr data-item-id="${backpack.id}">
                          <td>${backpack.name}</td>
                          <td>${backpack.system.space}</td>
                      </tr>`;
          dynamicBackpackContent.insertAdjacentHTML('beforeend', row);
          console.log(`Backpack ${backpack.name} in dynamische Tabelle abgelegt.`);
      } else {
          console.log("Backpack ist bereits in der dynamischen Tabelle.");
      }
    }

    // Methode für Drop von Tools in ein Backpack in der dynamischen Tabelle
    _onDropTool(event) {
      event.preventDefault();
      const toolId = event.dataTransfer.getData('text/plain');
      const toolItem = this.actor.items.get(toolId);

      const backpackId = event.currentTarget.dataset.itemId; 
      const backpackItem = this.actor.items.get(backpackId);

      if (backpackItem && toolItem) {
          this._handleToolDropInBackpack(toolItem, backpackItem);
      }
    }

    // Logik für das Ablegen eines Tools in ein Backpack
    _handleToolDropInBackpack(tool, backpack) {
      const availableSpace = backpack.system.space;
      const requiredSpace = tool.system.slots;

      if (availableSpace >= requiredSpace) {
          backpack.system.space -= requiredSpace;
          console.log(`Tool ${tool.name} in Backpack ${backpack.name} abgelegt.`);
      } else {
          ui.notifications.warn("Nicht genug Platz im Backpack!");
      }
    }
}