import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    track_pageview: true,
    persistence: 'localStorage'
  });
}

export const analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.identify(userId);
    if (traits) mixpanel.people.set(traits);
  },

  track: (event: string, properties?: Record<string, any>) => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.track(event, properties);
  },

  reset: () => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.reset();
  }
};
