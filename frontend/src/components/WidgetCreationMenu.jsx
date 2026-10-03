import React from 'react';

const WIDGET_CONFIG = {
  'Text Note': [
    { name: 'content', type: 'textarea', placeholder: 'Enter note content...' }
  ],
  'Image': [
    { name: 'url', type: 'text', placeholder: 'Enter image URL...' },
    { name: 'alt', type: 'text', placeholder: 'Alt text...' }
  ],
  'Metric Card': [
    { name: 'title', type: 'text', placeholder: 'Metric Title (e.g. Sales)' },
    { name: 'value', type: 'text', placeholder: 'Metric Value (e.g. 100)' }
  ],
  'To-Do List': [
    { name: 'title', type: 'text', placeholder: 'List Title...' }
  ]
};

export default function WidgetCreationMenu({ 
  isOpen, 
  selectedType, 
  onSelectType, 
  onCreate 
}) {
  if (!isOpen) return null;

  const widgetTypes = Object.keys(WIDGET_CONFIG);

  return (
    <div className="absolute top-full mt-4 left-0 w-80 p-5 apple-glass rounded-3xl origin-top animate-slide-down-fade z-50 flex flex-col space-y-5">
      <h3 className="text-black dark:text-white font-bold text-sm px-1">Create Widget</h3>
      
      {/* Toggle Buttons (Pills) */}
      <div className="flex flex-wrap gap-2">
        {widgetTypes.map(type => (
          <button
            key={type}
            onClick={() => onSelectType(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedType === type 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Dynamic Form Fields */}
      <div className="flex flex-col space-y-3 min-h-[120px]">
        {selectedType && WIDGET_CONFIG[selectedType].map((field, idx) => (
          field.type === 'textarea' ? (
            <textarea
              key={`${selectedType}-${idx}`}
              name={field.name}
              placeholder={field.placeholder}
              className="apple-glass w-full p-3 rounded-xl text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/50 resize-none h-24 text-sm bg-transparent transition-all"
            />
          ) : (
            <input
              key={`${selectedType}-${idx}`}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              className="apple-glass w-full px-4 h-10 rounded-full text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/50 text-sm bg-transparent transition-all"
            />
          )
        ))}
      </div>

      {/* Create Button */}
      <button 
        onClick={onCreate}
        disabled={!selectedType}
        className="w-full py-2.5 bg-blue-500/90 backdrop-blur-md border border-blue-400/50 text-white rounded-full hover:bg-blue-600/90 text-sm font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        Create Widget
      </button>
    </div>
  );
}
