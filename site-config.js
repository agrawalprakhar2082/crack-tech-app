// Shared settings for index.html and pay.html. Edit prices and payment details here.
window.CT = {
  // While true, price tags show a "sample price" label. Set to false once the real prices are in.
  PRICES_ARE_PLACEHOLDERS: true,

  // Packages a client can buy. `id` is used in links, e.g. pay.html?pkg=coach-3
  PACKAGES: [
    { id: "mock-3",  name: "Mock interview pack", sessions: "3 mock interviews (60 min each)",           price: 420  },
    { id: "coach-3", name: "Coaching pack",       sessions: "3 coaching sessions (90 min each)",         price: 810  },
    { id: "loop",    name: "Full interview loop", sessions: "3 coaching sessions + 3 mock interviews",   price: 1200 },
    { id: "mock-1",  name: "Single mock interview", sessions: "1 mock interview (60 min)",               price: 150  },
    { id: "coach-1", name: "Single coaching session", sessions: "1 coaching session (90 min)",           price: 300  },
  ],

  // Wise receiving details (USD). Copy them from Wise > Account details > USD.
  // pay.html shows a "preview" banner while accountHolder is empty.
  WISE: {
    accountHolder: "",
    email: "",          // for Wise-to-Wise transfers
    bankName: "",
    routingNumber: "",  // ACH routing number (US transfers)
    accountNumber: "",
    accountType: "Checking",
    swift: "",          // for international wires
  },

  // Formspree form ID for "I've paid" notices and call requests. Leave as-is for demo mode.
  FORMSPREE_ID: "YOUR_FORMSPREE_ID",
};

CT.pkg = id => CT.PACKAGES.find(p => p.id === id);
CT.money = n => "$" + n.toLocaleString("en-US");
