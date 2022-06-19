<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ElTable, ElTableColumn, ElAlert, ElUpload, ElButton, ElMessage } from 'element-plus'
import type { UploadInstance, UploadProps, UploadRawFile, UploadFile } from 'element-plus'
import { genFileId } from 'element-plus'
import { reactive, ref, nextTick } from 'vue';
import * as XLSX from 'xlsx'
import { putWorkbook } from '../common/js/utils'
import { download } from '../common/js/down'

type State = {
  list: any[],
  keys: any[]
}

const state = reactive<State>({
  list: [],
  keys: []
})

let downloadList: any = []

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value?.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value?.handleStart(file)
}

const handleUpload = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  ElMessage({
    message: '上传成功，正在计算',
    type: 'success',
  })
  try {
    const table = await readWorkbookFromLocalFile(file)
    const result = putWorkbook(table)
    console.log(result)
    state.list = result.result
    state.keys = result.keys
    downloadList = result.down
    nextTick(() => {
      ElMessage({
        message: '计算完成',
        type: 'success',
      })
    })
  } catch (error) {
    ElMessage({
      message: '上传失败，重新上传',
      type: 'error',
    })
  }
}

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

const handleDown = () => {
  if (downloadList.length) {
    download(downloadList)
  } else {
    ElMessage({
      message: '请先上传文件',
      type: 'error',
    })
  }
}

const options = [
  {
    value: 'Option1',
    label: '正常',
  },
  {
    value: 'Option2',
    label: '迟到',
  }
]

</script>

<template>
  <div>
    <div id="result"></div>
    <!-- <input type="file" name="execl" id="myfile" @change="handleChange"> -->
    <el-upload
      ref="upload"
      class="upload-demo"
      :limit="1"
      :on-exceed="handleExceed"
      :on-change="handleUpload"
      :auto-upload="false"
    >
      <template #trigger>
        <el-button type="primary">选择文件</el-button>
      </template>
      <template #tip>
        <div class="el-upload__tip text-red">
          limit 1 file, new file will cover the old file
        </div>
      </template>
    </el-upload>
    <el-button type="primary" @click="handleDown">点击下载</el-button>

    <el-alert :title="totalList" type="warning" :show-icon="true" :closable="false" />
    <el-table :data="state.list" stripe style="width: 100%">
      <el-table-column v-for="item in state.keys" :key="item.name" :prop="item.name" :label="item.label" width="220">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <span :class="{ active: scope.row[item.name].l }" :title="scope.row[item.name].o" style="white-space: pre-line;">{{ scope.row[item.name].s }}</span>
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
.active {
  color: red;
}
</style>
