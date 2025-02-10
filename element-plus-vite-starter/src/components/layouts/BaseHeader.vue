<template>
  <el-menu class="el-menu-demo" mode="horizontal" :ellipsis="false" router>
    <el-menu-item index="/">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">Сценарии</el-breadcrumb-item>
        <el-breadcrumb-item>
          <a href="/">Новый сценарий</a>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </el-menu-item>

    <el-menu-item>
      <el-switch
        v-model="value1"
        class="mb-2"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
        inactive-text="Сценарий запущен"
      />
    </el-menu-item>

    <el-menu-item>
        <el-button size="large" plain >История запусков</el-button>
        <el-button size="large" color="var(--ep-color-primary)" disabled>
        Сохранить<el-icon ><Check /></el-icon>
        </el-button>
    </el-menu-item>


  </el-menu>
</template>

<script lang="ts" setup>
import { repository } from '~/../package.json'
import { ref } from 'vue'
import {
  Check,
} from '@element-plus/icons-vue'

import { toggleDark } from '~/composables'

const value1 = ref(true)
</script>


<style lang="scss">

.el-menu-demo {
  &.ep-menu--horizontal > .ep-menu-item:nth-child(1) {
    margin-right: auto;
  }

  height: 78px;
  padding: 0 32px 0 28px;
  
  .ep-menu-item {
    padding: 0 6px;
  }

  .ep-breadcrumb__separator {
    margin: 0 7px;
  }

  .ep-switch__label.is-active {
    color: var(--ep-text-color-primary);
  }

  .ep-switch.is-checked .ep-switch__core {
    border-color: var(--active-green);
    background-color: var(--active-green);
  }

  .ep-switch {
    margin-bottom: 0;
    &>span {
      margin-right: 8px;
    }
    span {
      line-height: 21px;
    }
  }

  &.ep-menu--horizontal > .ep-menu-item:last-child {
    button {
      padding: 9px 20px;
    }
    i {
      margin-right: 0;
    }
  }

}

.ep-menu--horizontal .ep-menu-item:not(.is-disabled):hover, .ep-menu--horizontal .ep-menu-item:not(.is-disabled):focus {
  background-color: transparent;
}
</style>
