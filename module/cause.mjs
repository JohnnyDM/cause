//import CauseActor from './documents/actor.mjs'; //Import the main Actor ES module
import CauseActorSheet from './sheets/actor-sheet.mjs'; //Import the main Actor-Sheet ES module
//import CauseItem from './documents/item.mjs'; //Import the main Item ES module
import CauseItemSheet from "./sheets/item-sheet.mjs"; //Import the main Item-Sheet ES module
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs"; //Import helper document for handlebars
import { FE_WEAPONSKILLS } from './helpers/FE/FE_weaponskills.mjs';
import { FE_CORESKILLS } from './helpers/FE/FE_coreskills.mjs';
import { FE_RECSKILLS } from './helpers/FE/FE_recommendedskills.mjs';
import { DC_WEAPONSKILLS } from './helpers/DC/DC_weaponskills.mjs';
import { DC_CORESKILLS } from './helpers/DC/DC_coreskills.mjs';
import { DC_RECSKILLS } from './helpers/DC/DC_recommendedskills.mjs';

Hooks.once("init", function () {
    console.log("Cause TTFS | Initialising Cause Tabletop Framework System"); 

    game.settings.register('Cause TTFS', 'GenreSetting', {
      name: 'Genre Selection',
      hint: 'Choose a Genre to play in.',
      scope: 'world',     
      config: true,       
      type: String,       
      default: "frigid-earth",
      onChange: value => {
        console.log(value)
      },
      requiresReload: true,
      choices: {
        "frigid-earth": "Frigid Earth",
        "dreamcube": "DreamCube",
        },
      filePicker: "any"
    });

    game.cause = { 
      //CauseActor,
      //CauseItem,
    };
    
    //Load Configs
    const genreSetting = game.settings.get('Cause TTFS','GenreSetting');

    if (genreSetting === "frigid-earth") {
      CONFIG.WEAPONSKILLS = FE_WEAPONSKILLS;
      CONFIG.CORESKILLS = FE_CORESKILLS;
      CONFIG.SKILLS = FE_RECSKILLS;
    } else if (genreSetting === "dreamcube") {
      CONFIG.WEAPONSKILLS = DC_WEAPONSKILLS;
      CONFIG.CORESKILLS = DC_CORESKILLS;
      CONFIG.SKILLS = DC_RECSKILLS;
    }

    //CONFIG.WEAPONSKILLS = WEAPONSKILLS;
    //CONFIG.CORESKILLS = CORESKILLS;
    //CONFIG.SKILLS = RECSKILLS;

    Actors.unregisterSheet("core", ActorSheet); 
    Actors.registerSheet("cause", CauseActorSheet, {  types: ["character"], makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items. registerSheet("cause", CauseItemSheet, { makeDefault: true });

    //Handlebar Helpers
    Handlebars.registerHelper('formTimes', function(x, options) {
      let accum = '';
      for(let i = 0; i < 8; ++i) {
          if(i < x) {
              accum += options.fn(i);
          } else {
              accum += options.inverse(i);
          }
      }
      return accum;
    });

    Handlebars.registerHelper('mentalTimes', function(x, options) {
      let accum = '';
      for(let i = 0; i < 10; ++i) {
          if(i < x) {
              accum += options.fn(i);
          } else {
              accum += options.inverse(i);
          }
      }
      return accum;
    });

    Handlebars.registerHelper('unlessNameIn', function(name, list, options) {
      if (list.indexOf(name) === -1) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    game.settings.register("your-system", "defaultDiceSystem", {
      name: "Default Dice System",
      scope: "client",
      config: false,
      type: String,
      default: "custom-d6"
    });

    // Hook to Dice So Nice ready event
    Hooks.once('diceSoNiceReady', (dice3d) => {
        dice3d.addSystem({ id: "cause", name: "Cause" }, "default");
        dice3d.addDicePreset({
            type: "d6",
            labels: [
                "systems/cause/assets/dice/failure.png", // 1
                "systems/cause/assets/dice/blank.png",   // 2
                "systems/cause/assets/dice/blank.png",   // 3
                "systems/cause/assets/dice/success.png", // 4
                "systems/cause/assets/dice/success.png", // 5
                "systems/cause/assets/dice/crit_success.png" // 6
            ],
            system: "cause",
            shape: "d6",
            colorset: {
                foreground: "#000000",  // Schwarz für die Vorderseite
                background: "#000000"   // Schwarz für den Hintergrund
            }
        }, "d6");  // Specify the system here as well
    });

    return preloadHandlebarsTemplates(); 
})

Hooks.once("ready", function() {
  //testHandlebarsRendering();
});

Hooks.on('renderChatMessage', (app, html, data) => {
  html.find('.push-your-luck').click(CauseActorSheet._onPushYourLuck);
});
