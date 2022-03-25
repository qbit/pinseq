{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    #buildInputs = [ ];
    shellHook = ''
      export PS1='\u@\h:\w; '
      export NO_COLOR=1

    '';
    nativeBuildInputs = with pkgs.buildPackages; [
      nodePackages.typescript
      nodePackages.yarn
      esbuild
    ];
}
