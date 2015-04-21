/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function NodeData(el, tag, key) {
  this.attrs = {};
  this.key = key;
  this.keyMap = null;
  this.lastVisitedChild = null;
  this.tag = tag;
  this.text = null;
}


var initData = function(el, tag, key) {
  el.__incrementalDOMData = new NodeData(el, tag, key);
};


var getData = function(el) {
  if (!el.__incrementalDOMData && el.tagName) {
    initData(el, el.tagName.toLowerCase(), el.getAttribute('key') || ''); 
  }

  return el.__incrementalDOMData;
};


module.exports =  {
  getData: getData,
  initData: initData
};
