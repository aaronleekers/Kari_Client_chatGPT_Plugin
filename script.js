let isProcessing = false;
var textarea;

chrome.storage.sync.get(["web_access"], (data) => {
    isWebAccessOn = data.web_access;
});

async function showErrorMessage(e) {
    console.info("Kari.ai error --> API error: ", e);
    var errorDiv = document.createElement("div");
    errorDiv.classList.add("kari-ai-error", "absolute", "bottom-0", "right-1", "dark:text-white", "bg-red-500", "p-4", "rounded-lg", "mb-4", "mr-4", "text-sm");
    errorDiv.innerHTML = "<b>An error occurred</b><br>" + e + "<br><br>Check the console for more details.";
    document.body.appendChild(errorDiv);
    setTimeout(() => { errorDiv.remove(); }, 5000);
}

function pasteWebResultsToTextArea(results, query) {
    let formattedResults = JSON.stringify(results)
    let formattedStructure = `Question: ${query}, Information: ${formattedResults}`;
    textarea.value = formattedStructure;

}

async function pressEnter() {
    textarea.focus();
    const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter'
    });
    textarea.dispatchEvent(enterEvent);
}

async function api_search(query) {
    var url = `https://new-algorithm.up.railway.app/api_search`;
    console.log(`Sending ${query} to Server`);
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {query} })
    });
    console.log(response.status);  // <-- add this line
    const results = await response.json();
    console.log(`Response received!`);
    console.log(results);
    return results;
}

let label = "Get Financial Information";

async function onSubmit(event) {
    if (event.shiftKey && event.key === 'Enter') {
        return;
    }

    if ((event.type === "click" || event.key === 'Enter') && isWebAccessOn && !isProcessing) {
        isProcessing = true;
        label = "Loading...";
        document.querySelector(".kari-ai-toggle-label").innerHTML = label;
        try {
            let query = textarea.value;
            textarea.value = "";

            query = query.trim();

            if (query === "") {
                isProcessing = false;
                label = "Get Financial Information";
                document.querySelector(".kari-ai-toggle-label").innerHTML = label;
                return;
            }

            api_search(query)
              .then(results => {
                pasteWebResultsToTextArea(results, query);
                pressEnter();
                isProcessing = false;
                label = "Get Financial Information";
                document.querySelector(".kari-ai-toggle-label").innerHTML = label;
              });
        } catch (error) {
            isProcessing = false;
            label = "Get Financial Information";
            document.querySelector(".kari-ai-toggle-label").innerHTML = label;
            showErrorMessage(error);
        }
    }
}


function updateTitleAndDescription() {
    const h1_title = document.evaluate("//h1[text()='ChatGPT']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!h1_title) {
        return;
    }

    h1_title.textContent = "Kari.ai ChatGPT Integration";

    const div = document.createElement("div");
    div.classList.add("w-full", "bg-gray-50", "dark:bg-white/5", "p-6", "rounded-md", "mb-10", "border");
    div.textContent = "With Kari.ai ChatGPT Integration you can augment your prompts with immediate live financial data on a broad range of categories.";
    h1_title.parentNode.insertBefore(div, h1_title.nextSibling);

}

function updateUI() {

    if (document.querySelector(".kari-ai-toolbar")) {
        return;
    }

    textarea = document.querySelector("textarea");
    if (!textarea) {
        return;
    }
    var textareaWrapper = textarea.parentNode;

    var btnSubmit = textareaWrapper.querySelector("button");

    textarea.addEventListener("keydown", onSubmit);

    btnSubmit.addEventListener("click", onSubmit);


    var toolbarDiv = document.createElement("div");
    toolbarDiv.classList.add("kari-ai-toolbar", "flex", "items-baseline", "gap-3", "mt-0");
    toolbarDiv.style.padding = "0em 0.5em";

    let label = "Get Financial Information";
    // Left off on declaring loading info to variable to be worked with in handlesubmit button.

    // Web access switch
    var toggleWebAccessDiv = document.createElement("div");
    toggleWebAccessDiv.innerHTML = `<label class="kari-ai-toggle"><input class="kari-ai-toggle-checkbox" type="checkbox"><div class="kari-ai-toggle-switch"></div><span class="kari-ai-toggle-label">${label}</span></label>`;
    toggleWebAccessDiv.classList.add("kari-ai-toggle-web-access");
    chrome.storage.sync.get("web_access", (data) => {
        toggleWebAccessDiv.querySelector(".kari-ai-toggle-checkbox").checked = data.web_access;
    });

    var checkbox = toggleWebAccessDiv.querySelector(".kari-ai-toggle-checkbox");
    checkbox.addEventListener("click", () => {
            isWebAccessOn = checkbox.checked;
            chrome.storage.sync.set({ "web_access": checkbox.checked });
        });

    toolbarDiv.appendChild(toggleWebAccessDiv);

    textareaWrapper.parentNode.insertBefore(toolbarDiv, textareaWrapper.nextSibling);

    toolbarDiv.parentNode.classList.remove("flex");
    toolbarDiv.parentNode.classList.add("flex-col");


    var bottomDiv = document.querySelector("div[class*='absolute bottom-0']");

    var footerDiv = document.createElement("div");

    var extension_version = chrome.runtime.getManifest().version;
    footerDiv.innerHTML = "<a href='https://kariai.xyz' target='_blank' class='underline'>Kari.ai extension v." + extension_version + "</a>. If you like the extension, please consider visiting the link to see the future plans for this plug-in.</a>.";

    var lastElement = bottomDiv.lastElementChild;
    lastElement.appendChild(footerDiv);
}

const rootEl = document.querySelector('div[id="__next"]');

window.onload = () => {
   
    updateTitleAndDescription();
    updateUI();

    new MutationObserver(() => {
        try {
            updateTitleAndDescription();
            updateUI();
        } catch (e) {
            console.info("Kari.ai error --> Could not update UI:\n", e.stack);
        }
    }).observe(rootEl, { childList: true });
};
