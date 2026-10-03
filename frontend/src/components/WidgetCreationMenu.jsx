import React from 'react';

// Configuration mapping widget types to their required fields
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
  onBack, 
  onCreate 
}) {
  if (!isOpen) return null;

  const widgetTypes = Object.keys(WIDGET_CONFIG);

  return (
    <div className="absolute top-full mt-4 left-0 w-64 p-4 apple-glass rounded-2xl origin-top animate-slide-down-fade z-50">
      {!selectedType ? (
        <div className="flex flex-col space-y-2">
          <h3 className="text-white/80 text-sm font-semibold mb-2 px-2">Create Widget</h3>
          {widgetTypes.map(type => (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className="text-left px-3 py-2 text-white text-sm rounded-lg hover:bg-white/10 transition-colors"
            >
              {type}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <h3 className="text-white/80 text-sm font-semibold px-2">{selectedType}</h3>
          
          <div className="flex flex-col space-y-3">
            {WIDGET_CONFIG[selectedType].map((field, idx) => (
              field.type === 'textarea' ? (
                <textarea
                  key={idx}
                  name={field.name}
                  placeholder={field.placeholder}
                  className="apple-glass w-full p-3 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none h-24 text-sm bg-transparent"
                />
              ) : (
                <input
                  key={idx}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  className="apple-glass w-full px-4 h-10 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm bg-transparent"
                />
              )
            ))}
          </div>

          <div className="flex space-x-2 pt-2">
            <button 
              onClick={onBack}
              className="flex-1 py-2 apple-glass rounded-full text-white/80 hover:text-white text-xs font-semibold transition-colors"
            >
              Back
            </button>
            <button 
              onClick={onCreate}
              className="flex-1 py-2 bg-blue-500/80 backdrop-blur-md border border-blue-400/50 text-white rounded-full hover:bg-blue-600/80 text-xs font-semibold transition-colors shadow-lg"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
