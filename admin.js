const form = document.querySelector("#settings-form");
const message = document.querySelector("#message");
const fields = {
  siteName: document.querySelector("#site-name"),
  tagline: document.querySelector("#tagline"),
  accentColor: document.querySelector("#accent-color")
};
const shortcutList = document.querySelector("#shortcut-list");
const addShortcutButton = document.querySelector("#add-shortcut");
const videoList = document.querySelector("#video-list");
const addVideoButton = document.querySelector("#add-video");
const userList = document.querySelector("#user-list");

function renderShortcuts(shortcuts) {
  shortcutList.replaceChildren(...shortcuts.map((shortcut) => {
    const row = document.createElement("div");
    row.className = "shortcut-row";

    const name = document.createElement("input");
    name.type = "text";
    name.name = "name";
    name.maxLength = 32;
    name.placeholder = "Website name";
    name.required = true;
    name.setAttribute("aria-label", "Website name");
    name.value = shortcut.name;

    const url = document.createElement("input");
    url.type = "text";
    url.name = "url";
    url.maxLength = 2048;
    url.inputMode = "url";
    url.placeholder = "https://example.com";
    url.required = true;
    url.setAttribute("aria-label", "Website address");
    url.value = shortcut.url;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-shortcut";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${shortcut.name || "website"}`);
    remove.addEventListener("click", () => {
      row.remove();
    });

    row.append(name, url, remove);
    return row;
  }));
}

function readShortcuts() {
  return [...shortcutList.querySelectorAll(".shortcut-row")].map((row) => ({
    name: row.querySelector('[name="name"]').value,
    url: row.querySelector('[name="url"]').value
  }));
}

function renderVideos(videos) {
  videoList.replaceChildren(...videos.map((video) => {
    const row = document.createElement("div");
    row.className = "shortcut-row";

    const title = document.createElement("input");
    title.type = "text";
    title.name = "title";
    title.maxLength = 80;
    title.placeholder = "Video title";
    title.required = true;
    title.setAttribute("aria-label", "Video title");
    title.value = video.title;

    const url = document.createElement("input");
    url.type = "text";
    url.name = "url";
    url.maxLength = 2048;
    url.inputMode = "url";
    url.placeholder = "https://example.com/video";
    url.required = true;
    url.setAttribute("aria-label", "Video address");
    url.value = video.url;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-shortcut";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${video.title || "video"}`);
    remove.addEventListener("click", () => {
      row.remove();
    });

    row.append(title, url, remove);
    return row;
  }));
}

function readVideos() {
  return [...videoList.querySelectorAll(".shortcut-row")].map((row) => ({
    title: row.querySelector('[name="title"]').value,
    url: row.querySelector('[name="url"]').value
  }));
}

function renderUsers(users) {
  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No user accounts have been created.";
    userList.replaceChildren(empty);
    return;
  }
  userList.replaceChildren(...users.map((user) => {
    const card = document.createElement("article");
    card.className = "user-card";
    const heading = document.createElement("h3");
    heading.textContent = user.username;
    const created = document.createElement("p");
    created.className = "muted";
    created.textContent = `Created ${new Date(user.createdAt).toLocaleString()}`;
    const websites = document.createElement("ul");
    if (!user.websites.length) {
      const empty = document.createElement("li");
      empty.textContent = "No private websites saved.";
      websites.append(empty);
    }
    for (const website of user.websites) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `/open?url=${encodeURIComponent(website.url)}`;
      link.textContent = `${website.name} — ${website.url}`;
      item.append(link);
      websites.append(item);
    }
    card.append(heading, created, websites);
    return card;
  }));
}

async function request(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.location.assign("/admin");
    throw new Error(result.error ?? "The request failed.");
  }
  return result;
}

request("/api/admin/settings")
  .then((settings) => {
    for (const [key, field] of Object.entries(fields)) field.value = settings[key];
    renderShortcuts(settings.shortcuts);
    renderVideos(settings.videos);
  })
  .catch((error) => {
    message.textContent = error.message;
  });

request("/api/admin/users")
  .then(({ users }) => renderUsers(users))
  .catch((error) => {
    document.querySelector("#users-message").textContent = error.message;
  });

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Saving…";
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const settings = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value])
    );
    settings.shortcuts = readShortcuts();
    settings.videos = readVideos();
    await request("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    message.textContent = "Changes saved.";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

addShortcutButton.addEventListener("click", () => {
  const shortcuts = readShortcuts();
  shortcuts.push({ name: "", url: "" });
  renderShortcuts(shortcuts);
  shortcutList.querySelector(".shortcut-row:last-child [name='name']").focus();
});

addVideoButton.addEventListener("click", () => {
  const videos = readVideos();
  videos.push({ title: "", url: "" });
  renderVideos(videos);
  videoList.querySelector(".shortcut-row:last-child [name='title']").focus();
});

document.querySelector("#logout").addEventListener("click", async () => {
  try {
    await request("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    window.location.assign("/admin");
  } catch (error) {
    message.textContent = error.message;
  }
});
