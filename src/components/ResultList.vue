<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ElTable, ElTableColumn, ElAlert } from 'element-plus'
import { reactive } from 'vue';
import * as XLSX from 'xlsx'
import { putWorkbook } from '../common/js/utils'

type State = {
  list: any[],
  keys: any[]
}

const state = reactive<State>({ list: [], keys: [] })

function readWorkbookFromLocalFile(file: File) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      resolve(workbook)
    };
    reader.readAsBinaryString(file);
  })
}

const handleChange = async (e: any) => {
  const file: File = e.target.files[0]
  const table = await readWorkbookFromLocalFile(file)
  const result = putWorkbook(table)
  console.log(result)
  state.list = result.result
  state.keys = result.keys
}

const totalList = computed(() => {
  const count = state.list.length
  const title = count > 0 ? `总共 ${state.list.length} 条数据` : '暂无数据'
  return title
})


</script>

<template>
  <div>
    <input type="file" name="execl" id="myfile" @change="handleChange">
    <el-alert :title="totalList" type="warning" :show-icon="true" :closable="false" />
    <el-table :data="state.list" stripe style="width: 100%">
      <el-table-column v-for="item in state.keys" :key="item.name" :prop="item.name" :label="item.label" width="180">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <span :title="scope.row[item.name].o" style="margin-left: 10px">{{ scope.row[item.name].s }}</span>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.el-alert {
  margin: 20px 0 0;
}
.el-alert:first-child {
  margin: 0;
}
</style>
