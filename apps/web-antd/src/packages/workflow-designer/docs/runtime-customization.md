# 运行时展示定制指南

本文说明如何在 workflow-designer 中定制运行时节点展示与详情。

## 1. 运行数据来源
- 后端推送事件：`[NODE_RUN_<node_uuid>]`、`[NODE_INPUT_<node_uuid>]`、`[NODE_OUTPUT_<node_uuid>]` 等。
- 设计器在接收事件后，会将对应节点的 runtime 数据写入 `workflow.nodes[i].__runtime`，并携带 `nodeUuid`/`uuid`，用于前端匹配渲染。

## 2. 详情展开机制
- 设计器通过 `provide` 注入：
  - `wfRuntimeDetailUuid`：当前展开的节点 runtime id（字符串）。
  - `wfOpenRuntimeDetail(node)`：触发展开/收起。
  - `wfResolveRuntimeDetail(node)`：根据组件名解析详情组件（默认回退到通用详情）。
- 节点组件（如 `NodeShell.vue` / `StartNode.vue`）会在「查看详情」点击时调用 `wfOpenRuntimeDetail`，并根据 `wfRuntimeDetailUuid` 判断是否展开。

## 3. 在节点下方展示详情（不撑大卡片）
- 节点组件使用相对定位，在卡片下方绝对定位详情容器，避免撑大节点。
- 示例（精简版）：
  ```vue
  <div class="node-root">
    <div class="node-card">...节点主体...</div>
    <transition name="collapse">
      <div v-if="isExpanded && node.__runtime" class="runtime-detail-popup">
        <component :is="resolveRuntimeDetail(node.__runtime || node)" :node="node.__runtime || node" />
      </div>
    </transition>
  </div>
  ```
  样式关键点：
  ```css
  .node-root { position: relative; }
  .runtime-detail-popup {
    position: absolute; top: calc(100% + 8px); left: 0; width: 100%;
    background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 12px; z-index: 5;
  }
  ```

## 4. 定制组件名称映射
- 使用 `createComponentNameMap`（见 `utils/component-map.ts`）从外部传入 `componentIdMap`，保持移植时可配置。
- 运行视图与运行记录列表都可复用该映射。

## 5. 定制详情组件
- 约定放在 `properties/<Name>NodeRuntime.vue`，文件名中的 `<Name>` 为组件名（小写匹配）。
- 设计器会自动扫描并通过 `wfResolveRuntimeDetail` 下发。
- 例：为组件 `Answer` 增加详情，创建 `properties/answerNodeRuntime.vue`：
  ```vue
  <script setup>
  defineProps({ node: Object })
  </script>
  <template>
    <div>
      <div class="font-semibold mb-1">回答</div>
      <div class="whitespace-pre-wrap">{{ node?.output?.content?.value }}</div>
    </div>
  </template>
  ```

## 6. 运行记录列表（RunDetail/RuntimeNodes）
- `RuntimeNodes.vue` 接收 `nodes`（运行节点列表）和 `componentIdMap`，与设计器保持一致的映射方式。
- 详情同样通过 `wfRuntimeDetailUuid` 控制单展开。

## 7. 常见问题
- 点击无响应：检查 `node.__runtime.nodeUuid` 是否与 `wfRuntimeDetailUuid` 相同，确保事件里的 node uuid 写入到设计节点的 `__runtime`。
- 详情不显示/空白：确认对应组件是否有 `properties/<Name>NodeRuntime.vue`，否则会使用默认详情展示输入/输出。
- 卡片被撑大：采用上述“卡片外部绝对定位”方案，不要把详情放在卡片内部流式布局。

