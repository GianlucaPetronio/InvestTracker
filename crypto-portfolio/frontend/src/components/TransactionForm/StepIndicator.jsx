export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                transition-all duration-300
                ${currentStep >= step.number
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
            >
              {currentStep > step.number ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : step.number}
            </div>
            <span className={`mt-2 text-sm font-medium
              ${currentStep >= step.number
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
              }`}>
              {step.title}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-4 rounded transition-all duration-300
                ${currentStep > step.number
                  ? 'bg-indigo-600'
                  : 'bg-gray-200 dark:bg-gray-700'
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
