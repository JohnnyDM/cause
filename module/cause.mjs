//import CauseActor from './documents/actor.mjs'; //Import the main Actor ES module
import CauseActorSheet from './sheets/actor-sheet.mjs'; //Import the main Actor-Sheet ES module
//import CauseItem from './documents/item.mjs'; //Import the main Item ES module
import CauseItemSheet from "./sheets/item-sheet.mjs"; //Import the main Item-Sheet ES module
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs"; //Import helper document for handlebars
//import CAUSE from "./helpers/config.mjs";
import { WEAPONSKILLS } from './helpers/weaponskills.mjs';
import { CORESKILLS } from './helpers/coreskills.mjs';

Hooks.once("init", function () {
    console.log("Cause TTFS | Initialising Cause Tabletop Framework System"); //Initialisation message in console

    game.cause = { //register our main handling classes into the global game object to make it accessible for console debugging etc.
      //CauseActor,
      //CauseItem,
    };

    Handlebars.registerHelper('even', function (index) {
      return index % 2 === 0;
    });
  
    Handlebars.registerHelper('odd', function (index) {
      return index % 2 !== 0;
    });

    Handlebars.registerHelper('range', function(from, to) {
      let result = [];
      for (let i = from; i <= to; i++) {
          result.push(i);
      }
      return result;
  });

    Handlebars.registerHelper('concat', function () {
      var outStr = '';
      for (var arg in arguments) {
          if (typeof arguments[arg] !== 'object') {
              outStr += arguments[arg];
          }
      }
      return outStr;
  });

    //CONFIG.CAUSE = CAUSE; //creating a custom constant for our Config
    CONFIG.WEAPONSKILLS = WEAPONSKILLS;
    CONFIG.CORESKILLS = CORESKILLS;
    //override the base documents classes with our own
    //CONFIG.Actor.documentClass = CauseActor;
    //CONFIG.Item.documentClass = CauseItem;

    Actors.unregisterSheet("core", ActorSheet); //unregister the standard actor-sheet to make it unaccessible for users
    Actors.registerSheet("cause", CauseActorSheet, {  //register our Character sheets for:
        types: ["character"],                           //Character-type Actors
        makeDefault: true                                 //set default for new actors
      });

    Items.unregisterSheet("core", ItemSheet); //unregister the standard item-sheet to make it unaccessible for users
    Items. registerSheet("cause", CauseItemSheet, { makeDefault: true }); //registering the custom item-sheet
    //
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
              "systems/cause/assets/failure.png", // 1
              "systems/cause/assets/blank.png",   // 2
              "systems/cause/assets/blank.png",   // 3
              "systems/cause/assets/success.png", // 4
              "systems/cause/assets/success.png", // 5
              "systems/cause/assets/crit_success.png" // 6
          ],
          system: "cause",
          shape: "d6",
          colorset: {
              foreground: "#000000",  // Schwarz für die Vorderseite
              background: "#000000"   // Schwarz für den Hintergrund
          }
      }, "d6");  // Specify the system here as well
  });

    return preloadHandlebarsTemplates(); //preload our handlebars helper to be more easily accessible
})

Hooks.once("ready", function() {
  //testHandlebarsRendering();
});

Hooks.on('renderChatMessage', (app, html, data) => {
  html.find('.push-your-luck').click(CauseActorSheet._onPushYourLuck);
});
