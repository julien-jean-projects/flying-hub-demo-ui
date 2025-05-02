<script setup lang="ts">
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});

const toggleDark = useToggle(isDark);
</script>

<template>
  <div class="h-screen flex items-end justify-end p-2">
    <button class="border p-4 cursor-pointer rounded-md" @click="toggleDark()">Toggle {{ isDark ? "light" : "dark" }}</button>
  </div>
</template>
