<script setup lang="ts">
import type { FileChangeInfo } from 'fs/promises';

const handleChange = (e: any) => {
  const file = e.target.files[0]
}
</script>

<template>
  <div>
    <input type="file" name="execl" id="myfile" @change="handleChange">
  </div>
</template>

<style scoped>

</style>
