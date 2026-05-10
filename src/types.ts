export interface Herb {
  id: string;
  name: string;
  pinyin?: string;
  scientificName?: string;
  category?: string; // e.g. "辛温解表药"
  description?: string;
  natureTaste?: string; // 性味归经
  functions?: string; // 功效
  applications?: string[]; // 应用
  herbPairs?: { name: string; effect: string }[]; // 药对
  image: string;
  properties?: string[]; // Legacy compatibility
  channels?: string[]; // Legacy compatibility
  efficacy?: string; // Legacy compatibility
}

export interface Prescription {
  id: string;
  name: string;
  date: string;
  ingredients: string[]; // IDs of herbs
  analysis: string;
  indications: string[];
  limitations: string[];
  contraindications: string;
  usageTips: string;
  location: string;
  notes: string;
  type?: string; // e.g. "Granules", "Decoction"
}

export const WATERMARK_IMAGES = {
  SCHOLAR: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCim0AxBsApzMGEfmGs7L_t-0cqUZIRRBetAcXLki2PUg2PXImmlJIhi3wArXAzhn5DRb36lQyox2az0IB-4WVUfwCjUNMQQKAT7QEN8hmkugK-ymrO2w02IPvwJ4EihMxgsYsiUg8m8Gzg7s0bQc5G5TEvI7AiuITng2p--UL3h71gE-xVN2HLhyVcGIg_RhK2gkoPyt4UwmbYHq0MH3BMoaPGQniOm2IX1SExQplQTllPAr5x0_0yHmCwuAwaPKDERfvlku4Rac",
  BAMBOO: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEu-KJr3afgatoqI9FsGeA9aRzA_lkut3V662vT1X4UUVPg4VTvME6HxRrKUjBUy8IDXH27Ns3N7L0ALyzdFBtmkg0ceJ4moETYSwAbs6m0gI0LueE9f_X_LH5pYNJd9rhNzAfBtVsBKcsxEHf_xjyXxkNb4-sLgZ3MJ7TRHMOFTciJWorTiKKzXKZkHA2Rm5g0STUz20XKhyQzPXSkUwnYpnb2i6rJBRXm9e0jWysaSIWMV4BhDhzBLaVSb1gZclPAqblDG3kf6g",
  NATURE: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAWh5OJqvLpgiWocBu3cBuMS8XJelB5JsZvBgs89U_oNwjDZFEzDt7hGxko4ONaNsqiUjMLHNR1oI8ER-vmAOnZIyEBsfVGpJD21zDzOtVdScHjv-wrIFPUwOK8CjXqo1__cXLIXcuvgQfZx7dCXcDBvzjvd1L_xo1728CHAPaCWg5Bp4CUluINSD0NOL4b_OJZjU6c637on-E3uV9hGwud-FqS_JojxTw7puSldbqsmOejNCRcpDztuosdT1d1Ch0jh5oZwkdNxs"
};

export const MOCK_HERBS: Herb[] = [
  {
    id: "fang-feng",
    name: "防风",
    pinyin: "Fang Feng",
    scientificName: "Radix Saposhnikoviae",
    properties: ["Warm", "Acrid", "Sweet"],
    channels: ["Bladder", "Liver", "Spleen"],
    efficacy: "Releases the exterior and expels wind; Expels wind-dampness and alleviates pain; Extinguishes wind and stops spasms. Known as the 'wind medicine among wind medicines' due to its moistening nature that doesn't damage yin.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVYT5sSra7bMtrzMoF1oI8WqX7yxhOpvTVXTLM1GeRpdnFf0GXlhj8PiPs1BigjxRB7ouPNNHlhLGTC9Izu_DM2RCPcDkRYfUYaiMfQC73bu0RfANHx_ob0-HCrhCh8aPOcMs4weOzA4hKxpXrOBFRBHdTiKLBCpx98Ag0GYAfSBmPTQGWQPvbqH06r-jm3tAMc_UsAZg6GKiTpbluQTAs773PA3_oGJM0v_EaJfEQ1_1ZXYwHMX6hHFGL8qAv84coepz_8X4Cxr4"
  },
  {
    id: "jing-jie",
    name: "荆芥",
    pinyin: "Jing Jie",
    scientificName: "Schizonepeta tenuifolia",
    properties: ["Warm", "Acrid"],
    channels: ["Lung", "Liver"],
    efficacy: "Relieves exterior and dispels wind. Stops bleeding when charred.",
    image: "https://images.unsplash.com/photo-1544070078-a212eda27b49?auto=format&fit=crop&q=80&w=400"
  }
];

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "1",
    name: "消风止痒颗粒",
    date: "2026-05-07",
    ingredients: ["麻黄", "防风", "荆芥", "蝉蜕", "苦参"],
    analysis: "Formulated to dispel wind, clear heat, eliminate dampness, and relieve itching. Often prescribed for urticaria, eczema, and skin pruritus presenting with wind-damp-heat patterns.",
    indications: ["Acute urticaria (hives)", "Papular urticaria", "Eczema with severe itching"],
    limitations: ["Avoid during pregnancy"],
    contraindications: "Not suitable for pregnant women. Use with caution in patients with severe chronic diseases like hypertension.",
    usageTips: "Dissolve in warm water. Advise patient to avoid spicy, greasy, or seafood foods.",
    location: "Hangzhou, Zhejiang",
    notes: "Patient reported significant reduction in pruritus within 48 hours.",
    type: "Granules"
  }
];
