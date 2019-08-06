declare function record (): () => {
  stdout: string;
  stderr: string;
}

export default record;
