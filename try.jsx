import { useEffect, useState } from "react";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api";

const USE_MOCK = true;

const SECTIONS = ["BSIT 1-A", "BSIT 1-B", "BSIT 1-C"];
const EVENTS = ["Web Dev Bootcamp", "Git/GitHub 101", "Linux Essentials"];

const TEAM = [
  ["UI/UX", "Rel Jay Tugahan"],
  ["Front-End", "Joel Algadipe"],
  ["Backend", "Fhej Dale Placer"],
  ["Q/A", "Denver Reosura"],
];

const EMPTY = {
  student_name: "",
  student_id: "",
  section: "",
  event_name: "",
  email: "",
};

const btnPrimary =
  "inline-block cursor-pointer rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60";
const inputCls =
  "rounded-lg border border-line bg-white px-3 py-2.5 text-ink focus:border-brand";

let mockDb = [
  {
    id: 1,
    student_name: "Maria Santos",
    student_id: "2026-8812",
    section: "BSIT 1-A",
    event_name: "Web Dev Bootcamp",
    email: "maria@school.edu",
  },
  {
    id: 2,
    student_name: "Juan Dela Cruz",
    student_id: "2026-1045",
    section: "BSIT 1-B",
    event_name: "Git/GitHub 101",
    email: "juan@school.edu",
  },
];
let mockId = 3;

async function request(path, options = {}) {

  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok)
    throw { status: res.status, errors: data?.errors, message: data?.message };

  return data;
}

const api = {

  async list() {
    if (USE_MOCK) return [...mockDb];
    const data = await request("/attendees");

    return Array.isArray(data) ? data : data.data;
  },

  async create(payload) {
    if (USE_MOCK) {
      const row = { id: mockId++, ...payload };
      mockDb.push(row);
      return row;
    }
    return request("/attendees", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async remove(id) {
    if (USE_MOCK) {

      mockDb = mockDb.filter((a) => a.id !== id);
      return;
    }
    return request(`/attendees/${id}`, { method: "DELETE" });
  },
};

function validate(f) {
  const e = {};
  const name = f.student_name.trim();

  if (!name) e.student_name = "Enter your full name.";
  else if (name.split(/\s+/).length < 2)
    e.student_name = "Include your first and last name.";

  if (!f.student_id.trim()) e.student_id = "Enter your student ID.";
  else if (!/^\d{4}-\d{4}$/.test(f.student_id.trim()))
    e.student_id = "Use the format 2026-8812.";

  if (!f.section) e.section = "Choose your section.";
  if (!f.event_name) e.event_name = "Choose an event.";

  if (!f.email.trim()) e.email = "Enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = "Enter a valid email, like name@school.edu.";

  return e;
}

function Header({ count }) {
  return (

    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 bg-[#334478] px-5 py-2.5 text-white">
      <a href="#top" className="text-lg font-bold">
        BSIT Tech Society
      </a>
      <nav className="flex w-full gap-8 font-semibold sm:ml-auto sm:w-auto">

        <a href="#register" className="hover:underline">
          Register
        </a>

        <a href="#roster" className="hover:underline">
          Roster({count})
        </a>
        <a href="#contact" className="hover:underline">
          Contact
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="pb-4 pt-4">
      <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
        BSIT 1-C Team CodeSphere
      </h1>
      <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink">

        {TEAM.map(([role, name]) => (
          <span key={role}>
            {role}: {name}
          </span>
        ))}
      </p>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-1 font-medium">
      <span>{label}</span>
      {children}

      {error && (
        <small role="alert" className="font-normal text-bad">
          {error}
        </small>
      )}
    </label>
  );
}

function RegistrationForm({ onCreated }) {

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const set = (k) => (e) => {

    setForm({ ...form, [k]: e.target.value });

    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  async function submit(e) {
    e.preventDefault();
    setStatus(null);

    const found = validate(form);
    setErrors(found);

    if (Object.keys(found).length) return;

    setBusy(true);
    try {

      await api.create({
        ...form,
        student_name: form.student_name.trim(),
        email: form.email.trim(),
      });
      setForm(EMPTY);
      setStatus({ type: "ok", text: "Seat reserved. See you at the event!" });
      onCreated();
    } catch (err) {

      if (err.status === 422 && err.errors) {
        const mapped = {};
        Object.entries(err.errors).forEach(([k, v]) => (mapped[k] = v[0]));
        setErrors(mapped);
      } else {

        setStatus({
          type: "bad",
          text: "Couldn't reach the server. Check your connection and try again.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="register" className="scroll-mt-20 py-10">

      <form
        onSubmit={submit}
        noValidate
        className="grid max-w-[560px] gap-4 rounded-2xl border border-line bg-white p-7"
      >
        <h2 className="font-display text-3xl font-semibold">
          Reserve your seat
        </h2>

        <Field label="Full name" error={errors.student_name}>
          <input
            className={inputCls}
            value={form.student_name}
            onChange={set("student_name")}
            placeholder="Maria Santos"
            autoComplete="name"
          />
        </Field>

        <Field label="Student ID" error={errors.student_id}>
          <input
            className={inputCls}
            value={form.student_id}
            onChange={set("student_id")}
            placeholder="2026-8812"
            inputMode="numeric"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section" error={errors.section}>
            <select
              className={inputCls}
              value={form.section}
              onChange={set("section")}
            >
              <option value="">Choose section</option>

              {SECTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Event" error={errors.event_name}>
            <select
              className={inputCls}
              value={form.event_name}
              onChange={set("event_name")}
            >
              <option value="">Choose event</option>
              {EVENTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Email" error={errors.email}>
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="name@school.edu"
            autoComplete="email"
          />
        </Field>

        <button className={btnPrimary} disabled={busy}>
          {busy ? "Reserving..." : "Reserve seat"}
        </button>

        {status && (
          <p
            role="status"
            className={`font-medium ${status.type === "ok" ? "text-ok" : "text-bad"}`}
          >
            {status.text}
          </p>
        )}
      </form>
    </section>
  );
}

function RosterTable({ attendees, loading, onCancel }) {
  return (
    <section id="roster" className="scroll-mt-20 py-10">
      <h2 className="mb-4 font-display text-3xl font-semibold">Who's coming</h2>

      {loading ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-muted">
          Loading roster...
        </p>
      ) : attendees.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-muted">
          No one has registered yet. Be the first to reserve a seat.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="text-sm text-muted">
                <th className="border-b border-line px-4 py-3 font-semibold">
                  Name
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold">
                  Student ID
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold">
                  Section
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold">
                  Event
                </th>
                <th className="border-b border-line px-4 py-3">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>

              {attendees.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{a.student_name}</td>
                  <td className="px-4 py-3">{a.student_id}</td>
                  <td className="px-4 py-3">{a.section}</td>
                  <td className="px-4 py-3">{a.event_name}</td>
                  <td className="px-4 py-3">

                    <button
                      onClick={() => onCancel(a)}
                      className="cursor-pointer rounded-lg border border-line px-3 py-1.5 font-semibold text-bad hover:border-bad hover:bg-red-50"
                    >
                      Cancel RSVP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Welcome() {

  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setAttendees(await api.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function cancel(a) {

    if (!window.confirm(`Cancel the RSVP for ${a.student_name}?`)) return;
    await api.remove(a.id);
    load();
  }

  return (
    <>
      <Header count={attendees.length} />
      <main className="mx-auto max-w-4xl px-5">
        <Hero />

        <RegistrationForm onCreated={load} />
        <RosterTable
          attendees={attendees}
          loading={loading}
          onCancel={cancel}
        />
      </main>
    </>
  );
}
