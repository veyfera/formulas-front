<template>
<el-scrollbar max-height="85vh">
    <el-tree
      class="script-flow"
      style="max-width: 600px"
      :icon="Minus"
      :indent="45"
      :data="activities"
      node-key="id"
      default-expand-all
      :expand-on-click-node="false"
      :props="{ class: customNodeClass }"
    >
      <template #default="{ node, data }">
        <div class="script-flow-item">
          <el-icon @click="toggle(node)" v-if="data?.children && node?.parent.data.type != 'wrp'">
            <Minus v-if="node.expanded" />
            <Plus v-else />
          </el-icon>
          <MyIconPack :name="data.type" />
          <div class="script-flow-item__content">
            {{ data.title}}
            <span class="badge" v-if="data?.badge">{{ data?.badge}}</span>
            <div>{{ data.content }}</div>
          </div>
        </div>
      </template>
    </el-tree>
</el-scrollbar>
</template>

<script lang="ts" setup>
import {
  Plus,
  Minus,
} from '@element-plus/icons-vue'

import { ref } from 'vue'
import type Node from 'element-plus/es/components/tree/src/model/node'

interface Tree {
  id: number
  label: string
  children?: Tree[]
}
let id = 1000

const customNodeClass = (TreeNodeData, node: Node) => 
  node.data.type == 'wrp' ? 'wrp-node' : ''

const toggle = (node) =>
  node.expanded = node.expanded ? false : true;

let activities = [
  {
    title: 'Запуск сценария',
    content: '',
    type: 'start',
    badge: 'input',
    children: [
      {
        title: 'Http-запрос',
        content: 'https://hook.creatium.io/25gsf1ph594rnktv2cdtxum5ucjpav5f',
        type: 'web',
        badge: 'http',
      },
      {
        title: 'Таймер',
        content: '5 секунд',
        type: 'timer',
        badge: 'timer',
      },
      {
        content: '',
        timestamp: '2018-04-11',
        type: 'wrp',
        children: [
      {
        title: 'Если',
        content: '{{form.field_by_id = “Регистрация”}}',
        badge: '',
        type: 'condition',
        children: [
          {
            title: 'Найти запсь',
            content: 'В таблице Объявления',
            type: 'find-record',
            badge: 'searchRecords',
          },
          {
            title: 'Создать пользователя',
            content: 'В таблице Пользователи',
            type: 'user-add',
            badge: 'newUser',
          },
        ],
      },
      {
        title: 'Иначе',
        content: '{{form.field_by_id = “Новый администратор”}}',
        type: 'condition',
        badge: '',
        children: [
          {
            title: 'Найти запсь',
            content: 'В таблице Администраторы',
            type: 'find-record',
            badge: 'searchRecords',
          },
          {
            title: 'Создать запись',
            content: 'В таблице Администраторы',
            type: 'create-record',
            badge: 'newRecord',
          },
        ],
      },
        ]
      },
      {
        content: '',
        type: 'wrp',
        timestamp: '2018-04-13',
        children: [
          {
            title: 'Попробовать',
            content: '{{id = “Добавление статуса”}}',
            type: 'bug',
            badge: 'try',
            children: [  
              {
                title: 'Найти запсь',
                content: 'В таблице Статусы',
                type: 'find-record',
                badge: 'searchRecords',
              },
              {
                title: 'Создать запись',
                content: 'В таблице Статусы',
                type: 'create-record',
                badge: 'newRecord',
              },
            ]
          },
          {
            title: 'В случае ошибки',
            content: '',
            type: 'bug',
            badge: 'error',
            children: [
              {
                title: 'Создать запись',
                content: 'В таблице Пользователи',
                type: 'create-record',
                badge: 'searchRecords',
              },
            ]
          },
        ]
      },
      {
        title: 'Для каждого',
        content: '{{form.field_by_id = “Пользователи”}}',
        type: 'condition',
        badge: 'try',
        children: [
          {
            title: 'Найти запсь',
            content: 'В таблице Пользователи',
            type: 'find-record',
            badge: 'searchRecords',
          },
          {
            title: 'Создать запись',
            content: 'В таблице Города',
            type: 'create-record',
            badge: 'newRecord',
          },
        ]
      },
    ],
  },
]

</script>

<style>
.script-flow {
  .script-flow-item {
    display: flex;
    align-items: center;
    height: 45px;
    position: relative;
    box-sizing: border-box;
    margin-top: 20px;
    padding-bottom: 3px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      width: 24px;
      height: 1000vh;
      border-bottom: 1px solid;
      border-left: 1px solid;
      border-color: var(--ep-border-color);
      left: -24px;
      bottom: 45px;
      bottom: 24px;
      }

    .script-flow-item__content {
      display: inline-block;
      text-align: left;
      margin-left: 15px;
      font-size: 14px;
      font-family: 'Rubik', sans-serif;
      color: var(--ep-text-color-primary);

      .badge {
        color: var(--ep-color-primary);
        background-color: var(--color-primary-light);
        border-radius: 9px;
        margin-left: 8px;
        padding: 1px 6px;
        font-size: 12px;
      }

      div {
        font-size: 12px;
        line-height: 16px;
        color: var(--ep-text-color-secondary);
      }
  }

  }

  .ep-tree-node__content {
    height: auto;
      background-color: transparent!important;
  }

  .ep-tree-node__content > .ep-tree-node__expand-icon {
    display: none!important;
  }

  svg:not(i>svg) {
    height: 45px;
    width: 45px;
    border: 1px solid var(--ep-border-color);
    border-radius: 4px;
    background-color: #fff;
    z-index: 1000;
  }

  .ep-icon {
    position: absolute;
    left: -31px;
    top: 12px;
    background-color: #fff;
    border: 1px solid var(--ep-border-color);
    border-radius: 2px;
    z-index: 10000000;
    svg {
      width: 8px;
    }
  }
} 

.wrp-node[aria-expanded="false"] {
  .ep-tree-node__children {
    display: block!important;
    height: 65px;
    max-height: 65px!important;
  }
}

.wrp-node {
  >.ep-tree-node__content {
    .ep-icon {
      left: -31px;
      top: 47px;
    }
  }
  >.ep-tree-node__content {
      height: 0;
      ::before {
        content: '';
        display: none;
      }
  }
  >.ep-tree-node__children {
    margin-left: -45px;

    >:first-child {
      >.ep-tree-node__content {
        ::before {
          border-left: none;
          border-bottom: none;
          border-top: 1px solid;
          border-right: 1px solid;
          border-color: var(--ep-border-color);
          top: 22px;
          bottom: -230px;
          height: auto;
          width: 45px;
          z-index: 100;
        }
      }
    }

    >:not(:first-child) {
      >.ep-tree-node__content {
        ::before, ::after {
          display: none;
        }
      }
    }
  }
}
</style>
