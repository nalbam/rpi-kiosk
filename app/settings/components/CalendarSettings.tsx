import { KioskConfig } from '@/lib/config';

interface CalendarSettingsProps {
  config: KioskConfig;
  setConfig: (config: KioskConfig) => void;
}

export default function CalendarSettings({ config, setConfig }: CalendarSettingsProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 min-w-0">
      <h2 className="text-2xl font-semibold mb-6">Calendar Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Google Calendar URL</label>
          <input
            type="url"
            value={config.calendarUrl || ''}
            onChange={(e) => setConfig({ ...config, calendarUrl: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="https://calendar.google.com/calendar/ical/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the private iCal URL from Google Calendar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Refresh Interval</label>
            <input
              type="number"
              min="1"
              value={config.refreshIntervals.calendar}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1) {
                  setConfig({
                    ...config,
                    refreshIntervals: { ...config.refreshIntervals, calendar: value }
                  });
                }
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minutes between updates</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Events to Display</label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.displayLimits.calendarEvents}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 10) {
                  setConfig({
                    ...config,
                    displayLimits: { ...config.displayLimits, calendarEvents: value }
                  });
                }
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">1 to 10 events</p>
          </div>
        </div>
      </div>
    </div>
  );
}
