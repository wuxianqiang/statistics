<script setup lang="ts">
import { ElMenu, ElMenuItem } from 'element-plus'
import { config } from '../router/index'

const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<template>
  <div style="height: 100%;">
    <el-menu
      default-active="1"
      class="el-menu-demo"
      mode="vertical"
      @select="handleSelect"
      :router="true"
    >
      <el-menu-item
        v-for="(item, index) in config"
        :key="index" :index="item.path"
        :route="item">
        {{item.title}}
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.el-menu {
  height: 100%;
}

</style>
