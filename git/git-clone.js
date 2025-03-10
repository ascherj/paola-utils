const fs = require('fs');
const { exec, execSync } = require('child_process');

const GIT_RETURN_CODE = {
  ERROR_REPO_CLONE: 0,
  ERROR_REPO_PULL: 1,
  REPO_CLONED: 2,
  REPO_PULLED: 3,
  REPO_NOT_FOUND: 4,
  REPO_NOT_CHANGED: 5,
};

function getRepositoryURL(githubPath) {
  let auth = '';
  if (process.env.GIT_AUTH_USER && process.env.GIT_TOKEN) {
    auth = `${process.env.GIT_AUTH_USER}:${process.env.GIT_TOKEN}@`;
  }
  return `https://${auth}github.com/${githubPath}`;
}

// TODO: ls-remote not working with authentication when running on GH Actions
//       Spent too much time on this, just cloning and using rev-parse locally temporarily
// function getRemoteRepositoryHash(githubPath) {
//   return new Promise((resolve) => {
//     exec(`git ls-remote ${getRepositoryURL(githubPath)} HEAD`, (err, stdout) =>
//       resolve(err ? null : stdout.split('\t')[0]),
//     );
//   });
// }

function getLocalRepositoryHash(localPath) {
  return new Promise((resolve) => {
    exec(`GIT_DIR=${localPath}/.git git rev-parse HEAD`, (err, stdout) =>
      resolve(err ? null : stdout.trim()),
    );
  });
}

async function cloneOrPullRepository(localPath, githubPath, previousSHA) {
  // TODO: get ls-remote working to avoid extra clone step
  // const nextSHA = await getRemoteRepositoryHash(githubPath);
  // if (!nextSHA) {
  //   return {
  //     hash: undefined,
  //     code: GIT_RETURN_CODE.REPO_NOT_FOUND,
  //   };
  // }
  // const payload = { hash: nextSHA };
  // if (previousSHA === nextSHA) {
  //   payload.code = GIT_RETURN_CODE.REPO_NOT_CHANGED;
  //   return payload;
  // }
  const payload = {};

  return new Promise((resolve) => {
    if (!fs.existsSync(localPath)) {
      exec(
        `git clone ${getRepositoryURL(githubPath)} ${localPath} --depth 1`,
        (err) => {
          if (err) {
            console.log(err);
            resolve({
              hash: undefined,
              code: GIT_RETURN_CODE.REPO_NOT_FOUND,
              // code: GIT_RETURN_CODE.ERROR_REPO_CLONE,
            });
          } else {
            payload.code = GIT_RETURN_CODE.REPO_CLONED;
            getLocalRepositoryHash(localPath).then((hash) => {
              if (hash === previousSHA) {
                payload.code = GIT_RETURN_CODE.REPO_NOT_CHANGED;
              }
              payload.hash = hash;
              resolve(payload);
            });
          }
        },
      );
    } else {
      exec(`git -C ${localPath} pull`, (err) => {
        if (err) {
          resolve({
            hash: previousSHA,
            code: GIT_RETURN_CODE.ERROR_REPO_PULL,
          });
        } else {
          payload.code = GIT_RETURN_CODE.REPO_PULLED;
          getLocalRepositoryHash(localPath).then((hash) => {
            if (hash === previousSHA) {
              payload.code = GIT_RETURN_CODE.REPO_NOT_CHANGED;
            }
            payload.hash = hash;
            resolve(payload);
          });
        }
      });
    }
  });
}

module.exports = {
  cloneOrPullRepository,
  GIT_RETURN_CODE,
};
