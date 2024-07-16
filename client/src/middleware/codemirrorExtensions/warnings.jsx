import { EditorState, StateField, StateEffect, Extension } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";

// Define a StateEffect to add or remove the banner
export const setBannerEffect = StateEffect.define({
  map: (value, mapping) => mapping.map(value)
});

// Define the Widget for the banner
class BannerWidget extends WidgetType {
  constructor(content) {
    super();
    this.content = content;
  }

  toDOM() {
    const banner = document.createElement("div");
    banner.style.cssText = "background-color: yellow; padding: 10px; text-align: center;";
    banner.textContent = this.content;
    return banner;
  }
}

// Create a StateField to manage the banner decoration
export const bannerField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    // Apply effects to either add or remove the banner
    tr.effects.forEach(effect => {
      if (effect.is(setBannerEffect)) {
        const { value } = effect;
        if (value === null) {
          // Clear the decoration if value is null
          decorations = Decoration.none;
        } else {
          // Create a new decoration for the banner
          const widget = Decoration.widget({
            widget: new BannerWidget(value),
            side: -1 // Place at the top
          });
          decorations = Decoration.set([widget]);
        }
      }
    });
    return decorations;
  },
  provide: field => EditorView.decorations.from(field)
});
// Function to create an extension that includes the banner logic
export function bannerExtension(initialMessage = "") {
  return [
    bannerField,
    EditorView.updateListener.of(update => {
      // Example logic to remove the banner when the document changes
      if (update.docChanged) {
        update.view.dispatch({
          effects: setBannerEffect.of(null)
        });
      }
    }),
    // Initialize with a banner message
    initialMessage ? StateEffect.appendConfig.of(setBannerEffect.of(initialMessage)) : [],
  ];
}
