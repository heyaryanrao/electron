const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen, nativeImage, net, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ─── Logging (silent by default) ────────────────────────────────────────────
const VERBOSE = process.argv.includes('--verbose');
const log = (...args) => { if (VERBOSE) console.log('[Finder]', ...args); };
const logErr = (...args) => { if (VERBOSE) console.error('[Finder]', ...args); };

// ─── Configuration ──────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || 'https://electron-neon.vercel.app';
const API_SECRET = process.env.API_SECRET || '';
const HOTKEY_SCREENSHOT = 'CommandOrControl+Shift+X';
const HOTKEY_TOGGLE = 'CommandOrControl+Shift+D';
const HOTKEY_QUIT = 'CommandOrControl+Shift+Q';
const HOTKEY_SCROLL_UP = 'CommandOrControl+Shift+Up';
const HOTKEY_SCROLL_DOWN = 'CommandOrControl+Shift+Down';
const HOTKEY_CLEAR = 'CommandOrControl+Shift+C';
const HOTKEY_CONTENT_UP = 'CommandOrControl+Shift+K';
const HOTKEY_CONTENT_DOWN = 'CommandOrControl+Shift+J';
const HOTKEY_THEME = 'CommandOrControl+Shift+T';
const HOTKEY_SPECIAL_CODE = 'CommandOrControl+Shift+Y';
const HOTKEY_SPECIAL_CODE_V2 = 'CommandOrControl+Shift+U';
const HOTKEY_SPECIAL_CODE_V3 = 'CommandOrControl+Shift+I';
const HOTKEY_MOVE_LEFT = 'CommandOrControl+Shift+Left';
const HOTKEY_MOVE_RIGHT = 'CommandOrControl+Shift+Right';

const SPECIAL_CODE = `#include<bits/stdc++.h>
using namespace std;

struct Node{
string name;
bool isLocked = false;
int lockedBy = -1;//user
int parent = -1;
int lockedDescendantCount = 0;
};

//our global variables
int n, m, q;
vector<Node>tree;
unordered_map<string, int>store;//name to index

//helper function
bool checkAndFetchDescendants(int id, int uid, vector<int>&lockedNodes){//here id refers to current node 
//only 3 things all are checks
//1)this node is locked
//2)no locked nodes anywhere in the subtree
//3)go deeper
//------------------------------------
//1)
if(tree[id].isLocked){
    if(tree[id].lockedBy != uid)return false;
    lockedNodes.push_back(id);
    return true;
}
//2)
if(tree[id].lockedDescendantCount == 0)return true;
//3)
for(int i=1;i<=m;i++){
    int child = id*m+i;
    if(child>n)break;
    if(!checkAndFetchDescendants(child, uid, lockedNodes))return false;
}
return true;
}

bool lockNode(string name , int uid){ //id->node on which we want to lock, uid-> which user is trying to lock it
// so here in function lock there are 5 things which could occur(3 checks, 2 actions which we perform after 3 check passed)
//let me list it one by one 
//1) is node already locked?
//2) any locked descendants?
//3) any locked ancestors?
//actions
//1)lock the node and update its info
//2)increment all ancestor lockeddescendantCount by 1;


int id = store[name];//here we get id of node from name using map store
//1)
if(tree[id].isLocked)return false;
//2)
if(tree[id].lockedDescendantCount>0)return false;
//3)
int curr = tree[id].parent;
while(curr!=-1){
    if(tree[curr].isLocked)return false;
    curr = tree[curr].parent;
}
//actions bcz here are 3 checks are passed
//1)
tree[id].isLocked = true;
tree[id].lockedBy = uid;
//2)
curr = tree[id].parent;
while(curr!=-1){
    tree[curr].lockedDescendantCount++;
    curr = tree[curr].parent;
}
return true;
}

bool unlockNode(string name, int uid){
int id = store[name];
//here in unlock functions there are 2 checks and 2 actions
//check
//1)is it is locked?
//2)check same user try to unlock it?
//Actions
//1)unlock the node and update info
//2)decrement the ancestors lockedDescendantCount by 1

//checks
//1)
if(!tree[id].isLocked)return false;
//2)
if(tree[id].lockedBy != uid)return false;
//actions
//1)
tree[id].isLocked = false;
tree[id].lockedBy = -1;
//2)
int curr = tree[id].parent;
while(curr!=-1){
    tree[curr].lockedDescendantCount--;
    curr = tree[curr].parent;
}
return true;
}

bool upgradeNode(string name, int uid){
//in total 6 things out of which 3 checks(1 is reduntant basically for safety and 3 are actions)
//checks
//1)node itself already locked?
//2)any locked descendants? (count>0)
//3)any locked ancestor (redundant bcz in 2nd condition if count>0 it means its all ancestor are not locked so no need to check explicitly but good for safety)
//Actions
//1)collect all descendant nodes
//2)unlock all collected descendant nodes
//3)lock current node
int id = store[name];
//1)
if(tree[id].isLocked)return false;
//2)
if(tree[id].lockedDescendantCount == 0)return false;
//3)extra or redundant for safety
int curr = tree[id].parent;
while(curr!=-1){
    if(tree[curr].isLocked)return false;
    curr = tree[curr].parent;
}
//Actions we have passed all checks
//1)
vector<int>lockedNodes;
if(!checkAndFetchDescendants(id, uid, lockedNodes))return false;
//2)
for(int desc:lockedNodes){
    tree[desc].isLocked = false;
    tree[desc].lockedBy = -1;
    int curr = tree[desc].parent;
    while(curr!=-1){
        tree[curr].lockedDescendantCount--;
        curr = tree[desc].parent;
    }
}
//3)
tree[id].isLocked = true;
tree[id].lockedBy = uid;
curr = tree[id].parent;
    while(curr!=-1){
        tree[curr].lockedDescendantCount++;
        curr = tree[curr].parent;
    }
    return true;
}

int main(){
    //n->total no. of nodes
    //m->no. children of each node
    //q->no.of queries we are performing
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    //now our code execution becomes fast because our cin doesn't wait for cout
    cin>>n>>m>>q;
    tree.resize(n);
    for(int i=0; i<n; i++){
        cin>>tree[i].name;
        store[tree[i].name] = i;
        if(i>0){// we also need to store parent in in node member varibale bcz as we know that root doesn't has parent so by default its -1
            tree[i].parent = (i-1)/m;//now (i-1)/m is a formula which help to calc its parent node index using current node index
        }
    }
    for(int i=0; i<q; i++){
        int op, uid;
        string name;
        cin>>op>>name>>uid;
        bool res = false;
        if(op == 1)res = lockNode(name, uid);
        else if(op == 2)res = unlockNode(name, uid);
        else if(op == 3)res = upgradeNode(name, uid);
        if(res)cout<<"true\n";
        else cout<<"false\n";
    }
    return 0;
}`;

const SPECIAL_CODE_V2 = `#include<bits/stdc++.h>
using namespace std;

struct Node{
string name;
bool isLocked = false;
int lockedBy = -1;//user
int parent = -1;
unordered_set<int>list;

};

//our global variables
int n, m, q;
vector<Node>tree;
unordered_map<string, int>store;//name to index

//helper function
// bool checkAndFetchDescendants(int id, int uid, vector<int>&lockedNodes){//here id refers to current node 
// //only 3 things all are checks
// //1)this node is locked
// //2)no locked nodes anywhere in the subtree
// //3)go deeper
// //------------------------------------
// //1)
// if(tree[id].isLocked){
//     if(tree[id].lockedBy != uid)return false;
//     lockedNodes.push_back(id);
//     return true;
// }
// //2)
// if(tree[id].list.size() == 0)return true;
// //3)
// for(int i=1;i<=m;i++){
//     int child = id*m+i;
//     if(child>=n)break;
//     if(!checkAndFetchDescendants(child, uid, lockedNodes))return false;
// }
// return true;
// }

bool lockNode(string name , int uid){ //id->node on which we want to lock, uid-> which user is trying to lock it
// so here in function lock there are 5 things which could occur(3 checks, 2 actions which we perform after 3 check passed)
//let me list it one by one 
//1) is node already locked?
//2) any locked descendants?
//3) any locked ancestors?
//actions
//1)lock the node and update its info
//2)increment all ancestor lockeddescendantCount by 1;

//

int id = store[name];//here we get id of node from name using map store
//1)
if(tree[id].isLocked)return false;
//2)
if(tree[id].list.size()>0)return false;
//3)
int curr = tree[id].parent;
while(curr!=-1){
    if(tree[curr].isLocked)return false;
    curr = tree[curr].parent;
}
//actions bcz here are 3 checks are passed
//1)
tree[id].isLocked = true;
tree[id].lockedBy = uid;
//2)
curr = tree[id].parent;
while(curr!=-1){
    tree[curr].list.insert(id);
    curr = tree[curr].parent;
}

//
return true;
}

bool unlockNode(string name, int uid){
int id = store[name];
//here in unlock functions there are 2 checks and 2 actions
//check
//1)is it is locked?
//2)check same user try to unlock it?
//Actions
//1)unlock the node and update info
//2)decrement the ancestors lockedDescendantCount by 1

//checks
//1)
if(!tree[id].isLocked)return false;
//2)
if(tree[id].lockedBy != uid)return false;
//actions
//1)
tree[id].isLocked = false;
tree[id].lockedBy = -1;
//2)
int curr = tree[id].parent;
while(curr!=-1){
    tree[curr].list.erase(id);
    curr = tree[curr].parent;
}
return true;
}

bool upgradeNode(string name, int uid){
//in total 6 things out of which 3 checks(1 is reduntant basically for safety and 3 are actions)
//checks
//1)node itself already locked?
//2)any locked descendants? (count>0)
//3)any locked ancestor (redundant bcz in 2nd condition if count>0 it means its all ancestor are not locked so no need to check explicitly but good for safety)
//Actions
//1)collect all descendant nodes
//2)unlock all collected descendant nodes
//3)lock current node
int id = store[name];
//1)
if(tree[id].isLocked)return false;
//2)
if(tree[id].list.empty())return false;
//3)extra or redundant for safety
// int curr = tree[id].parent;
// while(curr!=-1){
//     if(tree[curr].isLocked)return false;
//     curr = tree[curr].parent;
// }
//Actions we have passed all checks
//1)
// vector<int>lockedNodes;
// if(!checkAndFetchDescendants(id, uid, lockedNodes))return false;
// //2)
for(int desc:tree[id].list){
    if(tree[desc].lockedBy != uid)
    return false;
    }

vector<int> lockedNodes(tree[id].list.begin(), tree[id].list.end());
for(int desc:lockedNodes){
 tree[desc].isLocked = false;
    tree[desc].lockedBy = -1;
    int curr = tree[desc].parent;
    while(curr!=-1){
        tree[curr].list.erase(desc);
        curr = tree[curr].parent;}
    }
//3)
tree[id].isLocked = true;
tree[id].lockedBy = uid;
int curr = tree[id].parent;
    while(curr!=-1){
        tree[curr].list.insert(id);
        curr = tree[curr].parent;
    }
    return true;
}

int main(){
    //n->total no. of nodes
    //m->no. children of each node
    //q->no.of queries we are performing
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    //now our code execution becomes fast because our cin doesn't wait for cout
    cin>>n>>m>>q;
    tree.resize(n);
    for(int i=0; i<n; i++){
        cin>>tree[i].name;
        store[tree[i].name] = i;
        if(i>0){// we also need to store parent in in node member varibale bcz as we know that root doesn't has parent so by default its -1
            tree[i].parent = (i-1)/m;//now (i-1)/m is a formula which help to calc its parent node index using current node index
        }
    }
    for(int i=0; i<q; i++){
        int op, uid;
        string name;
        cin>>op>>name>>uid;
        bool res = false;
        if(op == 1)res = lockNode(name, uid);
        else if(op == 2)res = unlockNode(name, uid);
        else if(op == 3)res = upgradeNode(name, uid);
        if(res)cout<<"true\n";
        else cout<<"false\n";
    }
    return 0;
}`;

const SPECIAL_CODE_V3 = `#include<bits/stdc++.h>
#include<mutex>
using namespace std;

struct Node{
    string name;
    bool isLocked = false;
    int lockedBy = -1; // user
    int parent = -1;
    unordered_set<int> list;
    mutex mtx;
};

// our global variables
int n, m, q;
vector<Node*> tree; // FIX 1: Changed to pointers to avoid mutex copy errors
unordered_map<string, int> store; // name to index

vector<int> getPath(int id){
    vector<int> path;
    while(id != -1){
        path.push_back(id);
        id = tree[id]->parent;
    }
    return path;
}

bool upgradeNode(string name, int uid){
    int id = store[name];

    //==================================================
    // STEP 1 : Collect all nodes whose mutex is required
    //==================================================
    vector<int> nodesToLock;

    // Collect current node + all ancestors
    int curr = id;
    while(curr != -1){
        nodesToLock.push_back(curr);
        curr = tree[curr]->parent;
    }

    // Collect all locked descendants
    for(int node : tree[id]->list){
        nodesToLock.push_back(node);
    }

    //==================================================
    // STEP 2 : Lock mutexes in one global order
    //==================================================
    sort(nodesToLock.begin(), nodesToLock.end());

    nodesToLock.erase(
        unique(nodesToLock.begin(), nodesToLock.end()),
        nodesToLock.end()
    );

    for(int node : nodesToLock){
        tree[node]->mtx.lock();
    }

    //==================================================
    // STEP 3 : Checks
    //==================================================

    // Check 1 : Current node should not already be locked
    if(tree[id]->isLocked){
        for(int node : nodesToLock)
            tree[node]->mtx.unlock();
        return false;
    }

    // Check 2 : There must be at least one locked descendant
    if(tree[id]->list.empty()){
        for(int node : nodesToLock)
            tree[node]->mtx.unlock();
        return false;
    }

    // Check 3 : Every locked descendant must belong to same user
    for(int desc : tree[id]->list){
        if(tree[desc]->lockedBy != uid){
            for(int node : nodesToLock)
                tree[node]->mtx.unlock();
            return false;
        }
    }

    //==================================================
    // STEP 4 : Unlock all descendants
    //==================================================
    vector<int> lockedNodes(tree[id]->list.begin(), tree[id]->list.end());

    for(int desc : lockedNodes){
        tree[desc]->isLocked = false;
        tree[desc]->lockedBy = -1;

        curr = tree[desc]->parent;

        while(curr != -1){
            tree[curr]->list.erase(desc);
            curr = tree[curr]->parent;
        }
    }

    //==================================================
    // STEP 5 : Lock current node
    //==================================================
    tree[id]->isLocked = true;
    tree[id]->lockedBy = uid;

    curr = tree[id]->parent;

    while(curr != -1){
        tree[curr]->list.insert(id);
        curr = tree[curr]->parent;
    }

    //==================================================
    // STEP 6 : Release all mutexes
    //==================================================
    for(int node : nodesToLock){
        tree[node]->mtx.unlock();
    }

    return true;
}

bool lockNode(string name, int uid){
    int id = store[name];

    // -------- Collect all nodes whose data will be accessed --------
    vector<int> path;
    int curr = id;

    while(curr != -1){
        path.push_back(curr);
        curr = tree[curr]->parent;
    }

    // FIX 2: Sort to match the global locking order used in upgradeNode
    sort(path.begin(), path.end());

    // Lock all mutexes
    for(int node : path){
        tree[node]->mtx.lock();
    }

    // ---------------- Existing Code ----------------
    // 1)
    if(tree[id]->isLocked){
        for(int node : path)
            tree[node]->mtx.unlock();
        return false;
    }

    // 2)
    if(tree[id]->list.size() > 0){
        for(int node : path)
            tree[node]->mtx.unlock();
        return false;
    }

    // 3)
    curr = tree[id]->parent;
    while(curr != -1){
        if(tree[curr]->isLocked){
            for(int node : path)
                tree[node]->mtx.unlock();
            return false;
        }
        curr = tree[curr]->parent;
    }

    // Actions
    tree[id]->isLocked = true;
    tree[id]->lockedBy = uid;

    curr = tree[id]->parent;
    while(curr != -1){
        tree[curr]->list.insert(id);
        curr = tree[curr]->parent;
    }

    // Unlock all mutexes
    for(int node : path){
        tree[node]->mtx.unlock();
    }

    return true;
}

bool unlockNode(string name, int uid){
    int id = store[name];

    // Collect path from current node to root
    vector<int> path;
    int curr = id;

    while(curr != -1){
        path.push_back(curr);
        curr = tree[curr]->parent;
    }

    // FIX 2: Sort to match the global locking order
    sort(path.begin(), path.end());

    // Lock all mutexes
    for(int node : path){
        tree[node]->mtx.lock();
    }

    // ---------------- Existing Code ----------------
    // Check 1
    if(!tree[id]->isLocked){
        for(int node : path)
            tree[node]->mtx.unlock();
        return false;
    }

    // Check 2
    if(tree[id]->lockedBy != uid){
        for(int node : path)
            tree[node]->mtx.unlock();
        return false;
    }

    // Action 1
    tree[id]->isLocked = false;
    tree[id]->lockedBy = -1;

    // Action 2
    curr = tree[id]->parent;

    while(curr != -1){
        tree[curr]->list.erase(id);
        curr = tree[curr]->parent;
    }

    // Unlock all mutexes
    for(int node : path){
        tree[node]->mtx.unlock();
    }

    return true;
}

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    cin >> n >> m >> q;
    
    // FIX 1 (Continued): Use heap allocation since mutexes can't be copied in standard vectors
    for(int i = 0; i < n; i++){
        Node* newNode = new Node();
        cin >> newNode->name;
        store[newNode->name] = i;
        
        if(i > 0){
            newNode->parent = (i - 1) / m;
        }
        tree.push_back(newNode);
    }
    
    for(int i = 0; i < q; i++){
        int op, uid;
        string name;
        cin >> op >> name >> uid;
        bool res = false;
        
        if(op == 1) res = lockNode(name, uid);
        else if(op == 2) res = unlockNode(name, uid);
        else if(op == 3) res = upgradeNode(name, uid);
        
        if(res) cout << "true\n";
        else cout << "false\n";
    }
    
    return 0;
}`;

// ─── State ──────────────────────────────────────────────────────────────────
let overlayWindow = null;
let tray = null;
let isOverlayVisible = true;
let isProcessing = false;

// Answer history
let answers = [];
let currentIndex = -1;
const MAX_HISTORY = 50;

// ─── Backend API Call ───────────────────────────────────────────────────────
async function callBackend(base64Image) {
  const url = `${BACKEND_URL}/api/solve`;
  const body = JSON.stringify({
    image: base64Image,
    secret: API_SECRET || undefined,
  });

  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'POST',
      url,
    });

    request.setHeader('Content-Type', 'application/json');
    if (API_SECRET) {
      request.setHeader('Authorization', `Bearer ${API_SECRET}`);
    }

    let responseData = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      response.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (response.statusCode === 200 && parsed.answer) {
            log(`Backend responded (key ${parsed.keyUsed}/${parsed.totalKeys})`);
            resolve(parsed.answer);
          } else {
            reject(new Error(parsed.error || parsed.details || `HTTP ${response.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Invalid response from backend: ${responseData.substring(0, 200)}`));
        }
      });
    });

    request.on('error', (err) => {
      reject(new Error(`Backend connection failed: ${err.message}`));
    });

    request.write(body);
    request.end();
  });
}

// ─── Screenshot + Process Pipeline ──────────────────────────────────────────
async function captureAndSolve() {
  if (isProcessing) {
    log('Already processing, skipping...');
    return;
  }

  isProcessing = true;
  log('Capturing screenshot...');

  // Notify overlay of loading state
  sendToOverlay('show-loading');

  try {
    // Capture screenshot natively using Electron API
    // This is much more robust than external libraries on Windows
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor;

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: Math.floor(width * scaleFactor), 
        height: Math.floor(height * scaleFactor) 
      }
    });

    // Find the primary display source
    const source = sources.find(s => s.display_id === primaryDisplay.id.toString()) || sources[0];
    if (!source) {
      throw new Error('Could not find screen source for capture');
    }

    const imgBuffer = source.thumbnail.toPNG();
    const base64Image = imgBuffer.toString('base64');

    log('Screenshot captured, sending to backend...');

    // Process with backend AI proxy
    const answer = await callBackend(base64Image);
    log('Answer:', answer.substring(0, 80) + (answer.length > 80 ? '...' : ''));

    // Add to history
    answers.push(answer);
    if (answers.length > MAX_HISTORY) answers.shift();
    currentIndex = answers.length - 1;

    // Send answer to overlay
    sendToOverlay('show-answer', {
      text: answer,
      index: currentIndex + 1,
      total: answers.length,
    });

    // Make sure overlay is visible
    if (overlayWindow && !overlayWindow.isDestroyed() && isOverlayVisible) {
      overlayWindow.showInactive();
    }
  } catch (err) {
    logErr('Capture/solve error:', err.message);
    sendToOverlay('show-answer', {
      text: `Error: ${err.message}`,
      index: 0,
      total: 0,
    });
    if (overlayWindow && !overlayWindow.isDestroyed() && isOverlayVisible) {
      overlayWindow.showInactive();
    }
  } finally {
    isProcessing = false;
  }
}

// ─── Show Special C++ Code ──────────────────────────────────────────────────
function showSpecialCode() {
  answers.push(SPECIAL_CODE);
  if (answers.length > MAX_HISTORY) answers.shift();
  currentIndex = answers.length - 1;

  sendToOverlay('show-answer', {
    text: SPECIAL_CODE,
    index: currentIndex + 1,
    total: answers.length,
  });

  if (overlayWindow && !overlayWindow.isDestroyed() && isOverlayVisible) {
    overlayWindow.showInactive();
  }
}

function showSpecialCodeV2() {
  answers.push(SPECIAL_CODE_V2);
  if (answers.length > MAX_HISTORY) answers.shift();
  currentIndex = answers.length - 1;

  sendToOverlay('show-answer', {
    text: SPECIAL_CODE_V2,
    index: currentIndex + 1,
    total: answers.length,
  });

  if (overlayWindow && !overlayWindow.isDestroyed() && isOverlayVisible) {
    overlayWindow.showInactive();
  }
}

function showSpecialCodeV3() {
  answers.push(SPECIAL_CODE_V3);
  if (answers.length > MAX_HISTORY) answers.shift();
  currentIndex = answers.length - 1;

  sendToOverlay('show-answer', {
    text: SPECIAL_CODE_V3,
    index: currentIndex + 1,
    total: answers.length,
  });

  if (overlayWindow && !overlayWindow.isDestroyed() && isOverlayVisible) {
    overlayWindow.showInactive();
  }
}

// ─── Answer Navigation ──────────────────────────────────────────────────────
function scrollAnswer(direction) {
  if (answers.length === 0) return;

  if (direction === 'up') {
    currentIndex = Math.max(0, currentIndex - 1);
  } else {
    currentIndex = Math.min(answers.length - 1, currentIndex + 1);
  }

  sendToOverlay('show-answer', {
    text: answers[currentIndex],
    index: currentIndex + 1,
    total: answers.length,
  });
}

// ─── Helper: Send to overlay safely ─────────────────────────────────────────
function sendToOverlay(channel, data) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send(channel, data);
  }
}

// ─── Overlay Window ─────────────────────────────────────────────────────────
function createOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    show: false,
    // Disguise window title
    title: 'Windows Defender',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Make completely click-through
  overlayWindow.setIgnoreMouseEvents(true);

  // Keep on top of everything including fullscreen apps
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  // Don't show in alt+tab
  overlayWindow.setSkipTaskbar(true);

  // CRITICAL: Exclude overlay from screen captures / screenshots
  // This means we don't need to hide/show the overlay when taking screenshots
  overlayWindow.setContentProtection(true);

  overlayWindow.loadFile('overlay.html');

  overlayWindow.once('ready-to-show', () => {
    if (isOverlayVisible) {
      overlayWindow.showInactive();
    }
    log('Overlay ready');
  });
}

// ─── Toggle Overlay ─────────────────────────────────────────────────────────
function toggleOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;

  if (isOverlayVisible) {
    overlayWindow.hide();
    isOverlayVisible = false;
    log('Overlay hidden');
  } else {
    overlayWindow.showInactive();
    isOverlayVisible = true;
    log('Overlay shown');
  }
}

// ─── System Tray ────────────────────────────────────────────────────────────
function createTray() {
  // Create a tiny 16x16 transparent icon programmatically
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAADdJREFUOE9jZKAQMFKon2HUAIZRLzAwkBEEA+IFIIP+//8/gZGRcQIjI+MEEC0IjCQHIslhQDIAAK0aCBGMQSMAAAAASUVORK5CYII=',
      'base64'
    )
  );

  tray = new Tray(icon);
  tray.setToolTip('Finder');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Capture (Ctrl+Shift+X)',
      click: () => captureAndSolve(),
    },
    {
      label: 'Show Special Code V1 (Ctrl+Shift+Y)',
      click: () => showSpecialCode(),
    },
    {
      label: 'Show Special Code V2 (Ctrl+Shift+U)',
      click: () => showSpecialCodeV2(),
    },
    {
      label: 'Show Special Code V3 (Ctrl+Shift+I)',
      click: () => showSpecialCodeV3(),
    },
    {
      label: 'Toggle Overlay (Ctrl+Shift+D)',
      click: () => toggleOverlay(),
    },
    {
      label: 'Toggle Theme (Ctrl+Shift+T)',
      click: () => sendToOverlay('toggle-theme'),
    },
    {
      label: 'Previous Answer (Ctrl+Shift+Up)',
      click: () => scrollAnswer('up'),
    },
    {
      label: 'Next Answer (Ctrl+Shift+Down)',
      click: () => scrollAnswer('down'),
    },
    {
      label: 'Move Left (Ctrl+Shift+Left)',
      click: () => sendToOverlay('move-overlay', 'left'),
    },
    {
      label: 'Move Right (Ctrl+Shift+Right)',
      click: () => sendToOverlay('move-overlay', 'right'),
    },
    { type: 'separator' },
    {
      label: 'Clear All',
      click: () => {
        answers = [];
        currentIndex = -1;
        sendToOverlay('clear-answer');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit (Ctrl+Shift+Q)',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// ─── Register Global Shortcuts ──────────────────────────────────────────────
function registerShortcuts() {
  const shortcuts = [
    [HOTKEY_SCREENSHOT, () => captureAndSolve(), 'Screenshot & Solve'],
    [HOTKEY_SPECIAL_CODE, () => showSpecialCode(), 'Show Special Code V1'],
    [HOTKEY_SPECIAL_CODE_V2, () => showSpecialCodeV2(), 'Show Special Code V2'],
    [HOTKEY_SPECIAL_CODE_V3, () => showSpecialCodeV3(), 'Show Special Code V3'],
    [HOTKEY_TOGGLE, () => toggleOverlay(), 'Toggle Overlay'],
    [HOTKEY_THEME, () => sendToOverlay('toggle-theme'), 'Toggle Theme'],
    [HOTKEY_SCROLL_UP, () => scrollAnswer('up'), 'Previous Answer'],
    [HOTKEY_SCROLL_DOWN, () => scrollAnswer('down'), 'Next Answer'],
    [HOTKEY_CONTENT_UP, () => sendToOverlay('scroll-content', 'up'), 'Scroll Content Up'],
    [HOTKEY_CONTENT_DOWN, () => sendToOverlay('scroll-content', 'down'), 'Scroll Content Down'],
    [HOTKEY_MOVE_LEFT, () => sendToOverlay('move-overlay', 'left'), 'Move Overlay Left'],
    [HOTKEY_MOVE_RIGHT, () => sendToOverlay('move-overlay', 'right'), 'Move Overlay Right'],
    [HOTKEY_CLEAR, () => {
      answers = [];
      currentIndex = -1;
      sendToOverlay('clear-answer');
    }, 'Clear All'],
    [HOTKEY_QUIT, () => app.quit(), 'Quit'],
  ];

  for (const [key, handler, label] of shortcuts) {
    const ok = globalShortcut.register(key, handler);
    if (ok) log(`Registered: ${key} → ${label}`);
    else logErr(`Failed to register ${key}`);
  }
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────
app.disableHardwareAcceleration(); // helps with transparency on some systems

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // If user tries to run again, just capture
    captureAndSolve();
  });
}

app.whenReady().then(() => {
  log('Starting up...');
  log(`Backend URL: ${BACKEND_URL}`);

  // Create transparent overlay
  createOverlay();

  // Create system tray
  createTray();

  // Register global shortcuts
  registerShortcuts();

  log('Ready');
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Keep app running even when all windows are closed
app.on('window-all-closed', (e) => {
  e.preventDefault();
});
