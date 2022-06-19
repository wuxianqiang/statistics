<script setup lang="ts">
import { ElTimeSelect, ElButton, ElMessage, ElDivider } from 'element-plus'
import { reactive } from 'vue';
import { setConfig } from '../common/js/utils'

type State = {
  config: {
    workShiftStart: string,
    workShiftEnd: string,
    lunchBreakStart: string,
    lunchBreakEnd: string,
    overtimeStart: string,
    overtimeEnd: string
  }
}

const state = reactive<State>({
  config: {
    workShiftStart: '08:00',
    workShiftEnd: '18:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    overtimeStart: '19:00',
    overtimeEnd: '21:00'
  }
})

const handleSave = () => {
  setConfig(state.config)
  ElMessage({
    message: '保存成功',
    type: 'success',
  })
}

</script>

<template>
  <div>
    <div>规则列表：</div>
    <div class="row">
      上班时间为
      <el-time-select
        v-model="state.config.workShiftStart"
        start="07:30"
        step="00:15"
        end="10:30"
        placeholder="Select time"
        :clearable="false"
      />
      到
      <el-time-select
        v-model="state.config.workShiftEnd"
        start="16:30"
        step="00:15"
        end="18:30"
        placeholder="Select time"
        :clearable="false"
      />
    </div>
    <div class="row">
      午休时间为
      <el-time-select
        v-model="state.config.lunchBreakStart"
        start="11:30"
        step="00:15"
        end="12:00"
        placeholder="Select time"
        :clearable="false"
      />
      到
      <el-time-select
        v-model="state.config.lunchBreakEnd"
        start="12:30"
        step="00:15"
        end="14:30"
        placeholder="Select time"
        :clearable="false"
      />
    </div>
    <div class="row">
      加班时间为
      <el-time-select
        v-model="state.config.overtimeStart"
        start="18:30"
        step="00:15"
        end="19:30"
        placeholder="Select time"
        :clearable="false"
      />
      到
      <el-time-select
        v-model="state.config.overtimeEnd"
        start="20:00"
        step="00:15"
        end="22:00"
        placeholder="Select time"
        :clearable="false"
      />
    </div>
    <div style="margin-top: 20px;">
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
    <el-divider />
    <div class="title">计算规则：</div>
    <ul>
      <li>早上8点之前上班，上班时间记为8点</li>
      <li>早上8点之后上班，记为迟到时间，(如：08:02上班，则迟到2分钟)</li>
      <li>中午12之前离开，记为早退，并且累计到迟到时间里面，(如：11：58离开，则早退2分钟)</li>
      <li>下午13点之前上班，上班时间记为13点</li>
      <li>下午13点之后上班，记为迟到时间，(如：13.02上班，则迟到2分钟)</li>
      <li>下午17点之前离开，记为早退，并且累计到迟到时间里面，(如：16:58离开，则早退2分钟)</li>
      <li>下午17-18点之间记为工作日加班时间</li>
      <li>下午19-21点之间记为工作日加班时间</li>
    </ul>
    <div class="title">3个时间计算逻辑</div>
    <ul>
      <li>系统会删除中间的时间，保留第1个和第3个时间</li>
      <li>07:58  12:00 12:36，上班时间记为4小时，无加班</li>
      <li>07:56 12:03 18:32，上班时间记为8小时，加班时间记为1小时</li>
      <li>12:08 12:51 18:16</li>
    </ul>
    <div class="title">2个时间计算逻辑</div>
    <ul>
      <li>07:58  12:00，上班时间记为4小时，无加班</li>
      <li>12:58  18:00，上班时间记为4小时，加班时间记为1小时</li>
      <li>07:58  18:00，上班时间记为8小时，加班时间记为1小时</li>
    </ul>
  </div>
</template>

<style scoped>
.el-alert {
  margin: 20px 0 0;
}
.el-alert:first-child {
  margin: 0;
}

.row {
  margin-top: 6px;
}

.title {
  margin-top: 24px;
  margin-bottom: 6px;
}
</style>
