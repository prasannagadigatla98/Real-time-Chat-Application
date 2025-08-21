const { useEffect, useMemo, useRef, useState } = React;

// Simple per-tab realtime via BroadcastChannel (fallback to storage events)
class ChatBus {
	constructor(channel = "prasanna-chat") {
		this.channelName = channel;
		this.listeners = new Set();
		try {
			this.bc = new BroadcastChannel(channel);
			this.bc.onmessage = (e) => this.emit(e.data);
		} catch (e) {
			window.addEventListener("storage", (ev) => {
				if (ev.key === channel && ev.newValue) this.emit(JSON.parse(ev.newValue));
			});
		}
	}
	post(data) {
		const payload = { ...data, _ts: Date.now() };
		if (this.bc) this.bc.postMessage(payload);
		else localStorage.setItem(this.channelName, JSON.stringify(payload));
	}
	on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
	emit(data) { this.listeners.forEach((fn) => fn(data)); }
}

const CONTACTS = [
	{ id: "chat-a", name: "Chat A", color: "#10ffb4", color2: "#7b61ff" },
	{ id: "chat-b", name: "Chat B", color: "#7b61ff", color2: "#10ffb4" },
	{ id: "chat-c", name: "Chat C", color: "#ff7b7b", color2: "#ffcb6b" },
	{ id: "chat-d", name: "Chat D", color: "#5bd3ff", color2: "#8b5cf6" }
];

const EMOJIS = [
	"😀","😁","😂","🤣","😊","😍","😎","🤩","😇","😉","🥳","🤗",
	"👍","👏","🙏","🔥","✨","🎉","❤️","💙","💚","💜","🧡","💥",
	"😅","😢","😭","😡","🤔","😴","🤯","😜","🤝","✅","❌","⚡"
];

function Reactions({ m, me, onReact }) {
	const set = new Set(m.reactions || []);
	const palette = ["👍", "❤️", "😂", "🔥", "🎉", "✨"];
	return (
		<div className="reactions">
			{palette.map((e) => (
				<button key={e} className={"react" + (set.has(e) ? " active" : "")} onClick={() => onReact(e)}>{e}</button>
			))}
			{set.size > 0 && <span className="hint">{Array.from(set).join(" ")}</span>}
		</div>
	);
}

function App() {
	const [me] = useState({ id: "prasanna", name: "prasanna" });
	const [activeId, setActiveId] = useState(CONTACTS[0].id);
	const [messagesByChat, setMessagesByChat] = useState(() => (JSON.parse(localStorage.getItem("prasanna.messages") || "{}")));
	const [input, setInput] = useState("");
	const [showEmoji, setShowEmoji] = useState(false);
	const busRef = useRef(null);
	const listRef = useRef(null);

	useEffect(() => {
		busRef.current = new ChatBus("prasanna-chat");
		const off = busRef.current.on((evt) => {
			if (evt.type === "message" && evt.to === me.id) {
				setMessagesByChat((m) => {
					const prev = m[evt.from] || [];
					// mark delivered when it arrives
					const delivered = { ...evt.message, status: "delivered" };
					return { ...m, [evt.from]: [...prev, delivered] };
				});
			}
			if (evt.type === "seen" && evt.peer === me.id) {
				// other side confirmed they viewed the last message we sent
				setMessagesByChat((m) => {
					const arr = m[evt.contact] || [];
					if (!arr.length) return m;
					const last = arr[arr.length - 1];
					if (last.from === me.id) {
						const updated = [...arr];
						updated[updated.length - 1] = { ...last, status: "seen" };
						return { ...m, [evt.contact]: updated };
					}
					return m;
				});
			}
		});
		return off;
	}, [me.id]);

	useEffect(() => {
		localStorage.setItem("prasanna.messages", JSON.stringify(messagesByChat));
		if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight + 200;
	}, [messagesByChat, activeId]);

	const activeContact = useMemo(() => CONTACTS.find((c) => c.id === activeId), [activeId]);
	const thread = messagesByChat[activeId] || [];

	// update theme variables per chat
	useEffect(() => {
		if (!activeContact) return;
		document.documentElement.style.setProperty("--accent", activeContact.color);
		document.documentElement.style.setProperty("--accent-2", activeContact.color2 || activeContact.color);
	}, [activeContact]);

	// when I (prasanna) view a thread, notify the peer that I saw their last msg
	useEffect(() => {
		if (!busRef.current) return;
		const arr = messagesByChat[activeId] || [];
		if (!arr.length) return;
		const last = arr[arr.length - 1];
		if (last.from !== me.id) {
			busRef.current.post({ type: "seen", contact: me.id, peer: activeId });
		}
	}, [activeId, messagesByChat]);

	function send() {
		if (!input.trim()) return;
		const message = { id: crypto.randomUUID(), text: input, from: me.id, to: activeId, ts: Date.now(), status: "sent" };
		// Push to my view
		setMessagesByChat((m) => ({ ...m, [activeId]: [ ...(m[activeId] || []), message ] }));
		// Notify the other tab (their contact id is the sender name)
		busRef.current?.post({ type: "message", to: activeId, from: me.id, message });
		setInput("");
		setShowEmoji(false);
	}

	function toggleReact(id, emoji) {
		setMessagesByChat((m) => {
			const arr = [...(m[activeId] || [])];
			const idx = arr.findIndex((x) => x.id === id);
			if (idx === -1) return m;
			const msg = { ...arr[idx] };
			const cur = new Set(msg.reactions || []);
			if (cur.has(emoji)) cur.delete(emoji); else cur.add(emoji);
			msg.reactions = Array.from(cur);
			arr[idx] = msg;
			return { ...m, [activeId]: arr };
		});
	}

	function onKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
	}

	return (
		<div className="app">
			<aside className="sidebar">
				<div className="brand"><span className="dot"></span> Prasanna Chat</div>
				<div className="hint">You: {me.name}</div>
				<div className="contacts">
					{CONTACTS.map((c) => (
						<div key={c.id} className={"contact" + (c.id === activeId ? " active" : "")} onClick={() => setActiveId(c.id)}>
							{c.name}
						</div>
					))}
				</div>
			</aside>
			<main className="chat" style={{ background: `linear-gradient(180deg, ${activeContact.color}22, transparent)` }}>
				<header className="header" style={{ borderColor: activeContact.color }}>
					<div className="title">Chat with {activeContact.name}</div>
				</header>
				<section className="messages" ref={listRef}>
					{thread.map((m, idx) => {
						const isLast = idx === thread.length - 1;
						return (
							<div key={m.id} className="message">
								<div className={"bubble " + (m.from === me.id ? "mine" : "") + (isLast ? " pop" : "") } style={m.from !== me.id ? { borderColor: activeContact.color + "66" } : {}}>
								<div className="meta">{m.from === me.id ? me.name : activeContact.name} • {new Date(m.ts).toLocaleTimeString()}</div>
								<div>{m.text}</div>
								<Reactions m={m} me={me} onReact={(emoji) => toggleReact(m.id, emoji)} />
								{m.from === me.id && (
									<div className="status">{m.status === "seen" ? "Seen" : m.status === "delivered" ? "Delivered" : "Sent"}</div>
								)}
							</div>
						</div>
						);
					})}
				</section>
				<footer className="composer" style={{ position: "relative" }}>
					<div className="toolbar">
						<button className="emoji-btn" onClick={() => setShowEmoji((s) => !s)}>🙂 Emoji</button>
					</div>
					{showEmoji && (
						<div className="emoji-popover">
							{EMOJIS.map((e) => (
								<div key={e} className="emoji" onClick={() => setInput((v) => v + e)}>{e}</div>
							))}
						</div>
					)}
					<textarea value={input} placeholder="Type and press Enter" onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} />
					<button onClick={send}>Send</button>
				</footer>
			</main>
		</div>
	);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);


