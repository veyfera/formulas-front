<template>
<el-container>
  <el-menu
    default-active="2"
    class="el-menu-vertical-demo"
    :collapse="true"
    @open="handleOpen"
    @close="handleClose"
  >
    <el-menu-item index="0" class="menu-logo">
      <Logo />
    </el-menu-item>
    <div class="menu-desc">Сайт</div>
    <el-menu-item index="1">
      <el-icon><memo /></el-icon>
    </el-menu-item>
    <el-menu-item index="2">
      <el-icon><MyIconPack name="puzzle" /></el-icon>
    </el-menu-item>
    <el-menu-item index="3">
      <el-icon><setting /></el-icon>
    </el-menu-item>
    <el-divider />
    <div class="menu-desc">Данные</div>
    <el-menu-item index="4">
      <el-icon><coin /></el-icon>
    </el-menu-item>
    <el-menu-item index="5">
      <el-icon><folder /></el-icon>
    </el-menu-item>
    <el-divider />
    <div class="menu-desc">Логика</div>
    <el-menu-item index="6">
      <el-icon><MyIconPack name="play" /></el-icon>
    </el-menu-item>
    <el-menu-item index="7">
      <el-icon><connection /></el-icon>
    </el-menu-item>
    <el-menu-item index="8">
      <el-icon><calendar /></el-icon>
    </el-menu-item>
  </el-menu>

<div class="scripts">
    <el-input
      class="scripts-search"
      v-model="search"
      placeholder="Поиск"
      :prefix-icon="Search"
    />

    <el-tree
      class="scripts-tree"
      :icon="ArrowRightBold"
      :data="dataSource"
      node-key="id"
      default-expand-all
      :expand-on-click-node="false"
    >
      <template #default="{ node, data }">
        <span class="scripts-tree-node">
            <el-icon v-if="data?.children" color="#FFB03A" size="16"><Folder /></el-icon>
            <MyIconPack name='play' v-else/>
<span>
                {{ node.label }}
                <div :style="{color: data?.desc == 'Запущен' ? 'var(--active-green)' : 'var(--ep-text-color-secondary)'}">{{ data?.children ? `${node.data?.children.length} сценария` : data?.desc}}</div>
            </span>
          <el-button :icon="MoreFilled" text />
        </span>
      </template> </el-tree>

    <div class="scripts-buttons">
        <el-button :icon="Plus" size="large">Новый сценарий</el-button>
        <el-button :icon="FolderAdd" size="large"/>
    </div>
</div>
</el-container>


</template>

<script lang="ts" setup>

import {
  Plus,
  Search,
  ArrowRightBold,
  Memo,
  Setting,
  Coin,
  Folder,
  Calendar,
  Connection,
  FolderAdd,
  MoreFilled
} from '@element-plus/icons-vue'

import Logo from '../Logo.vue'

import { ref } from 'vue'
import type Node from 'element-plus/es/components/tree/src/model/node'

const isCollapse = ref(true)
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

interface Tree {
  id: number
  label: string
  children?: Tree[]
}
let id = 1000

const dataSource = ref<Tree[]>([
  {
    id: 1,
    label: 'Telegram-бот',
    desc: 'Запущен',
  },
  {
    id: 2,
    label: 'Сайт',
    children: [
      {
        id: 3,
        label: 'Новый сценарий',
        desc: 'Запущен',
      },
      {
        id: 4,
        label: 'Регистрация',
        desc: 'Остановлен',
      },
      {
        id: 5,
        label: 'Регистрация',
        desc: 'Запущен',
      },
    ],
  },
])

const search = ref('');

</script>

<style>
.el-menu-vertical-demo .ep-menu-item:hover {
/*.el-menu-vertical-demo .ep-menu-item:hover,.el-menu-vertical-demo .ep-sub-menu__title:hover{*/
  background-color: var(--light-violet);
}

.el-menu-vertical-demo .ep-menu-item:not(:first-child) {
/*.el-menu-vertical-demo .ep-menu-item:not(:first-child),.el-menu-vertical-demo .ep-sub-menu__title{*/
  display: flex;
  justify-content: center;
  border-radius: 4px;
  margin: 0 12px;
  padding: 0 12px;
  width: 45px;
  height: 45px;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  min-height: 400px;
  height: 100%;
  min-width: 70px;
  .menu-logo {
    padding: 32px 19px;
    &:hover {
      background-color: transparent;
    }
  }

  .menu-desc {
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .ep-divider {
    border-color: #DCDFE6;
    margin: 8px 6px 16px;
    width: auto;
  }
}

.scripts {
  border-right: solid 1px var(--ep-menu-border-color);
  width: 100%;
  display: flex;
  flex-direction: column;
}

.scripts-search {
  margin: 19px 17px;
  height: 40px;
  width: auto;
}

.scripts-tree {
  .ep-tree-node__content {
    height: 51px;
    line-height: 23px;
    transition: background-color .25s ease-in-out;

    &:hover {
      background-color: var(--light-violet);
    }

    .ep-tree-node__expand-icon {
      margin-bottom: auto;
    }

    span {
      margin-left: 5px;
      text-align: left;
    }
    div {
      font-size: 12px;
      line-height: 20px;
    }
  }
} 

.scripts-tree-node {
  display: flex;
  width: 100%;

  .ep-button {
    margin-left: auto;
    padding: 12px;
  }
}

.scripts-buttons {
  margin-top: auto;
  margin-bottom: 16px;

  button:hover {
    background-color: var(--color-primary-light);
  }
  button:first-child {
    padding: 9px 52px;
  }
  button:last-child {
    padding: 12px;
  }
}
</style>
