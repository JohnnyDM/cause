export function registerHelpers() {
    // Madness Icons Helper
    Handlebars.registerHelper('pendulumIcons', function (currentValue) {
        const maxValue = 11; // Total number of icons
        const neutralPoint = 5; // Index of the separator "I"
        let result = '';
      
        for (let i = 0; i < maxValue; i++) {
          if (i === neutralPoint) {
            // Add the "I" separator
            result += '<span class="separator">I</span>';
          } else {
            // Determine the class for the icon
            let iconClass = 'fa-thin fa-circle';
            if (i < neutralPoint && neutralPoint - i <= Math.abs(currentValue) && currentValue < 0) {
              iconClass = 'fa-solid fa-circle'; // Left side for negative values
            } else if (i > neutralPoint && i - neutralPoint <= currentValue && currentValue > 0) {
              iconClass = 'fa-solid fa-circle'; // Right side for positive values
            }
      
            // Render the icon
            result += `<i class="${iconClass}" data-index="${i}"></i>`;
          }
        }
      
        return new Handlebars.SafeString(result);
      });
  
      Handlebars.registerHelper("diceIcon", () => {
        const diceType = game.settings.get("cause", "currentDice");
        return `fa-solid fa-dice-${diceType}`;
      });

    console.log('CustomSystem | Handlebars helpers registered.');
}