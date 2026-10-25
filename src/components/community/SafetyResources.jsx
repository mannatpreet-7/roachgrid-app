import { useState } from "react";
import { Phone, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
const contacts = [
  [
    "112",
    "All emergencies",
    "Police, fire and medical emergency response across India.",
    "https://112.gov.in/",
  ],
  [
    "100",
    "Police",
    "Traditional police helpline; 112 is the integrated emergency number.",
    "https://www.india.gov.in/directory/helpline",
  ],
  [
    "101",
    "Fire & rescue",
    "Fire helpline. Move to safety before calling.",
    "https://www.india.gov.in/directory/helpline",
  ],
  [
    "102",
    "Ambulance / health transport",
    "Service scope varies by state. For immediate life-threatening danger, call 112.",
    "https://www.india.gov.in/directory/helpline",
  ],
  [
    "181",
    "Women’s helpline",
    "Support for women in distress; availability/scope varies by state. In immediate danger call 112.",
    "https://www.ncw.gov.in/other-useful-helplines/",
  ],
  [
    "1091",
    "Women’s safety",
    "Listed women’s helpline; local availability varies.",
    "https://www.incredibleindia.gov.in/en/emergency",
  ],
];
export default function SafetyResources() {
  const { data, update, notify, location } = useApp();
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [error, setError] = useState("");
  function save(e) {
    e.preventDefault();
    const clean = phone.replace(/[\s()-]/g, "");
    if (name.trim().length < 2 || !/^\+?[0-9]{7,15}$/.test(clean)) {
      setError(
        "Enter a name and a valid 7–15 digit phone number, optionally starting with +.",
      );
      return;
    }
    if (
      update((d) => ({
        ...d,
        emergencyContacts: [
          ...(d.emergencyContacts || []),
          { id: crypto.randomUUID(), name: name.trim(), phone: clean },
        ],
      }))
    ) {
      setName("");
      setPhone("");
      setError("");
      notify("Personal emergency contact saved in this browser only.");
    }
  }
  return (
    <section className="safety-resources">
      <div className="section-heading">
        <div>
          <p className="eyebrow">BE PREPARED, NOT ALARMED</p>
          <h2>Safety essentials & emergency contacts</h2>
        </div>
      </div>
      <p className="content-note">
        These numbers are for India. Calling a link opens your device’s dialer
        where supported; this website does not make a call automatically or
        dispatch help. Never make test calls. If a specialist number is
        unavailable in your state, use 112 for an emergency.
      </p>
      <div className="emergency-grid">
        {contacts.map(([n, t, d, src]) => (
          <article className="resource-card" key={n}>
            <Phone size={19} />
            <h3>{t}</h3>
            <a className="emergency-number" href={"tel:" + n}>
              {n}
            </a>
            <p>{d}</p>
            <a
              className="phrase-source"
              target="_blank"
              rel="noreferrer"
              href={src}
            >
              Government source ↗
            </a>
          </article>
        ))}
      </div>
      <div className="safety-layout">
        <article className="panel">
          <h3>Practical safety measures</h3>
          <ul className="safety-list">
            <li>
              Move away from fire, traffic, unstable structures or other
              immediate hazards; do not enter danger to investigate.
            </li>
            <li>
              Call 112 for an emergency. Give the exact address or landmark,
              type of emergency and a callback number. Follow the dispatcher’s
              instructions.
            </li>
            <li>
              Keep exits clear, use a safe evacuation route and follow
              instructions from local authorities.
            </li>
            <li>
              Check weather and official local advisories before travel. Do not
              drive through floodwater.
            </li>
            <li>
              Keep a charged phone and trusted contact details available. Treat
              user-submitted reports as unverified.
            </li>
          </ul>
          <p className="micro">
            General preparation guidance, not a substitute for first-aid
            training or official instructions.
          </p>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.label}: ${location.lat}, ${location.lon}`,
                );
                notify(
                  "Selected exploring-area coordinates copied. Confirm they describe the incident location before sharing.",
                );
              } catch {
                notify("Clipboard unavailable. Read coordinates in Explore.");
              }
            }}
          >
            Copy exploring-area coordinates (not necessarily GPS)
          </button>
        </article>
        <article className="panel">
          <h3>My personal emergency contacts</h3>
          <p className="content-note">
            Private to this browser profile, not uploaded or alerted
            automatically. Anyone using this browser profile can see these
            contacts.
          </p>
          <form onSubmit={save}>
            <label>
              Contact name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={70}
                required
              />
            </label>
            <label>
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={25}
                required
                placeholder="+91…"
              />
            </label>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <button className="button primary">Save emergency contact</button>
          </form>
          {!(data.emergencyContacts || []).length && (
            <p className="content-note">
              No personal emergency contacts saved yet.
            </p>
          )}
          {(data.emergencyContacts || []).map((c) => (
            <div className="saved-row" key={c.id}>
              <div>
                <b>{c.name}</b>
                <a href={"tel:" + c.phone}>{c.phone}</a>
              </div>
              <button
                className="icon-btn"
                aria-label={`Remove contact ${c.name}`}
                onClick={() => {
                  if (window.confirm("Remove this personal contact?"))
                    update((d) => ({
                      ...d,
                      emergencyContacts: (d.emergencyContacts || []).filter(
                        (x) => x.id !== c.id,
                      ),
                    }));
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
